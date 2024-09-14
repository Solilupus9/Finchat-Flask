import concurrent.futures
import itertools
import os
import tempfile
import requests
from flask import jsonify, request
from flask_login import login_required, login_user, logout_user, current_user
from sqlalchemy.orm import Session
from .models import *
from .config import app, login_manager
from flask_migrate import Migrate
import boto3
from botocore.exceptions import NoCredentialsError
import hashlib
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from pinecone.grpc import PineconeGRPC as Pinecone
import google.generativeai as genai
import pyttsx3
import multiprocessing

engine = pyttsx3.init()
engine.setProperty('rate', 175)
tts_process=None
init_models(app)
migrate = Migrate(app, db)
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

prompt = [{'role': 'user', 'parts': '''Your name is FinChat.
You are an AI assistant specializing in annual reports.
FinChat is a powerful, human-like AI with expert knowledge, helpfulness, and cleverness.
The user interacts with FinChat to understand the annual reports.
Answer the user's questions, understanding synonymous words related to the documents.
Be friendly and cheerful but do not use emoticons.
Address only the documents in your responses.
Explain terms used in your responses so the user understands the content.
Use simple and easy-to-understand language.
Provide insights about the data.
If asked to create graphs or charts, refer to the context for values and write code for charts using HighCharts.js.
Do not answer questions that are not related to the annual report.'''},
		  {'role': 'model', 'parts': ''}]

model = genai.GenerativeModel('gemini-1.5-flash')
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
pinecone_index = pc.Index(os.getenv('PINECONE_INDEX_NAME'))
s3 = boto3.client('s3', aws_access_key_id=os.getenv('PUBLIC_S3_ACCESS_KEY_ID'),
				  aws_secret_access_key=os.getenv('PUBLIC_S3_SECRET_ACCESS_KEY'),
				  region_name=os.getenv('PUBLIC_S3_REGION'))


@login_manager.user_loader
def load_user(user_id):
	with Session(db.engine) as session:
		return session.get(User, int(user_id))


def handle_error(e, message='An error occurred'):
	print(f'{message}: {e}')
	return jsonify({'message': message}), 500


@app.route('/api/sign_in', methods=['POST'])
def sign_in():
	data = request.get_json()
	username = data.get('username')
	password = data.get('password')

	try:
		user = User.query.filter_by(username=username).first()
		if user and user.check_password(password):
			login_user(user)
			return jsonify({'message': 'Login successful'}), 200
		return jsonify({'message': 'Invalid credentials'}), 401
	except Exception as e:
		return handle_error(e, 'Login error')


@app.route('/api/sign_up', methods=['POST'])
def sign_up():
	data = request.get_json()
	username = data.get('username')
	password = data.get('password')
	email = data.get('email')

	if not username or not password or not email:
		return jsonify({'message': 'All fields are required'}), 400

	try:
		if User.query.filter_by(email=email).first():
			return jsonify({'message': 'Email already in use'}), 400

		new_user = User()
		new_user.username = username
		new_user.email = email
		new_user.set_password(password)
		db.session.add(new_user)
		db.session.commit()

		return jsonify({'message': 'Sign up successful'}), 201
	except Exception as e:
		return handle_error(e, 'Sign up error')


@app.route('/api/status', methods=['GET'])
def status():
	if current_user.is_authenticated:
		chats=Chats.query.filter_by(username=current_user.username).all()
		return jsonify({
			'logged_in': True,
			'username': current_user.username,
			'email': current_user.email,
			'n_chats': len(chats)
		}), 200
	return jsonify({
		'logged_in': False,
		'username': '',
		'email': ''
	}), 200


@app.route('/api/sign_out', methods=['POST'])
@login_required
def sign_out():
	try:
		logout_user()
		return jsonify({'message': 'Sign out successful'}), 200
	except Exception as e:
		return handle_error(e, 'Sign out error')


@app.route('/api/update_user', methods=['POST'])
@login_required
def update_user():
	data = request.get_json()
	username = data.get('username')
	email = data.get('email')
	password = data.get('password')

	if not username or not email:
		return jsonify({'message': 'Username and email are required'}), 400

	try:
		current_user.username = username
		current_user.email = email
		if password:
			current_user.set_password(password)
		db.session.commit()
		return jsonify({'username': current_user.username, 'email': current_user.email}), 200
	except Exception as e:
		return handle_error(e, 'Update user error')


def truncate_string_by_bytes(string, b):
	return string.encode('utf-8')[:b].decode('utf-8', 'ignore')


def prepare_document(page_content, page_number):
	page_content = page_content.replace('\n', '')
	splitter = RecursiveCharacterTextSplitter(chunk_size=5000)
	return splitter.split_documents(
		[Document(
			page_content=page_content,
			metadata={
				'pageNumber': page_number,
				'text': truncate_string_by_bytes(page_content, 3600),
			}
		)]
	)


def convert_to_ascii(input_string):
	return ''.join(str(ord(char)) for char in input_string)


def chunks(iterable, batch_size=200):
	"""A helper function to break an iterable into chunks of size batch_size."""
	it = iter(iterable)
	chunk = tuple(itertools.islice(it, batch_size))
	while chunk:
		yield chunk
		chunk = tuple(itertools.islice(it, batch_size))


@app.route('/api/upload', methods=['POST'])
@login_required
def upload_file():
	if 'files' not in request.files:
		return jsonify({'message': 'No file part'}), 400

	files = request.files.getlist('files')
	if not files:
		return jsonify({'message': 'No selected file'}), 400

	pdf_names = []
	pdf_urls = []
	file_keys = []

	concatenated_file_names = ''.join([file.filename.replace(' ', '-') for file in files])
	namespace = hashlib.md5(concatenated_file_names.encode()).hexdigest()

	for file in files:
		pdf_names.append(file.filename)
		# S3 UPLOAD
		try:
			file_key = file.filename.replace(' ', '-')
			file_keys.append(file_key)
			s3.upload_fileobj(file, os.getenv('PUBLIC_S3_BUCKET_NAME'), file_key)
			print(f'{file_key} uploaded to S3 successfully')
		except NoCredentialsError:
			return jsonify({'message': 'AWS Credentials not available'}), 403
		except Exception as e:
			return handle_error(e, 'AWS file upload error')

		# PINECONE UPLOAD
		try:
			try:
				print('LOADING PDF')
				s3_file_url = f'https://{os.getenv("PUBLIC_S3_BUCKET_NAME")}.s3.{os.getenv("PUBLIC_S3_REGION")}.amazonaws.com/{file_key}'
				pdf_urls.append(s3_file_url)
				response = requests.get(s3_file_url)
				response.raise_for_status()

				with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
					temp_file.write(response.content)
					temp_file_path = temp_file.name

				loader = PyMuPDFLoader(temp_file_path)
				documents = loader.load()

				print('PDF LOADED')
			except Exception as e:
				return handle_error(e, 'Error loading PDF')

			# Prepare documents
			prepared_documents = []
			for page_number, doc in enumerate(documents, start=1):
				prepared_documents.extend(prepare_document(doc.page_content, page_number))

			# Embed and upload documents
			def embed(document):
				try:
					hash_id = hashlib.md5(document.page_content.encode('utf-8')).hexdigest()
					embeddings = genai.embed_content(model='models/text-embedding-004', content=document.page_content,
													 task_type='retrieval_document')
					r = {
						'id': hash_id,
						'values': embeddings['embedding'],
						'metadata': {
							'pageNumber': document.metadata['pageNumber'],
							'text': document.metadata['text'],
						}
					}
					if r:
						return r
				except Exception as exc:
					print(f'Error embedding document: {exc}')
					return None

			with concurrent.futures.ThreadPoolExecutor() as executor:
				vectors = list(executor.map(embed, prepared_documents))

			for vector_chunks in chunks(vectors, batch_size=1000):
				pinecone_index.upsert(vector_chunks, namespace=namespace)

			os.remove(temp_file_path)
			print('Upload complete')
		except Exception as e:
			return handle_error(e, 'Pinecone upload error')

	# CHATS TABLE INSERT
	try:
		new_chat = Chats(pdf_names=pdf_names, pdf_urls=pdf_urls, username=current_user.username, file_keys=file_keys)
		db.session.add(new_chat)
		db.session.commit()
		return jsonify({'message': 'Files uploaded and processed successfully', 'pdf_urls': pdf_urls}), 200
	except Exception as e:
		return handle_error(e, 'Chat upload error')


@app.route('/api/chats', methods=['GET'])
@login_required
def get_chats():
	try:
		user_chats = Chats.query.filter_by(username=current_user.username).order_by(Chats.created_at).all()
		chats = [{'id': chat.chat_id, 'pdf_names': chat.pdf_names, 'pdf_urls': chat.pdf_urls} for chat in user_chats]
		return jsonify(chats), 200
	except Exception as e:
		return handle_error(e, 'Error fetching chats')


@app.route('/api/init_chat', methods=['POST'])
@login_required
def init_chat():
	data = request.get_json()
	chat_id = data.get('chat_id')
	messages = data.get('messages')
	if not chat_id:
		return jsonify({'message': 'Chat ID is required'}), 400

	try:
		chat_details = Chats.query.filter_by(chat_id=chat_id).first()
		if not chat_details:
			return jsonify({'message': 'Chat not found'}), 404

		# Initialize the chat with the provided message history
		history = prompt + [{'role': message['role'], 'parts': message['content']} for message in messages]
		chat = model.start_chat(history=history)

		# Store the chat object in a global dictionary or session
		app.config['CHATS'][chat_id] = {'chat': chat, 'file_keys': chat_details.file_keys}
		return jsonify({'message': 'Chat initialized successfully', 'chat_id': chat_id}), 200
	except Exception as e:
		return handle_error(e, 'Error initializing chat')


@app.route('/api/check_chat_initialized/<int:chat_id>', methods=['GET'])
@login_required
def check_chat_initialized(chat_id):
	try:
		chat_session = app.config['CHATS'].get(chat_id)
		if chat_session:
			return jsonify({'initialized': True}), 200
		return jsonify({'initialized': False}), 200
	except Exception as e:
		return handle_error(e, 'Error checking chat initialization')


def speak_text(text):
	engine.say(text)
	engine.runAndWait()


@app.route('/api/query', methods=['POST'])
@login_required
def query_gemini():
	global tts_process
	data = request.get_json()
	query = data.get('query')
	chat_id = data.get('chat_id')
	tts = data.get('tts')
	print("TTS:", tts)

	if not query or not chat_id:
		return jsonify({'message': 'Query and chat_id are required'}), 400

	try:
		# Retrieve the chat object from the global dictionary or session
		chat_session = app.config['CHATS'].get(chat_id)
		if not chat_session:
			return jsonify({'message': 'Chat not initialized'}), 400

		chat = chat_session['chat']
		file_keys = chat_session['file_keys']

		qembed = genai.embed_content(model='models/text-embedding-004', content=query, task_type='retrieval_query')

		concatenated_file_names = ''.join([file for file in file_keys])
		namespace = hashlib.md5(concatenated_file_names.encode()).hexdigest()

		# Query Pinecone for relevant context
		pinecone_response = pinecone_index.query(
			top_k=10,
			include_metadata=True,
			namespace=namespace,
			vector=qembed['embedding']
		)

		# Extract relevant context from Pinecone response
		context = " ".join([match['metadata']['text'] for match in pinecone_response['matches']])
		context += f'\n With above context the user asked: {query}'
		page_numbers = [match['metadata']['pageNumber'] for match in pinecone_response['matches']]
		# with open(f'context-{context_test}.txt', 'w') as f:
		# 	f.write(context)
		# 	context_test+=1

		# Send the query using the chat object
		response = chat.send_message(context)

		if tts and "Highcharts.chart('container'," not in response.text:
			if tts_process and tts_process.is_alive():
				tts_process.terminate()
			tts_process = multiprocessing.Process(target=speak_text, args=(response.text.replace('*',''),))
			tts_process.start()

		return jsonify({'response': response.text, 'context': context, 'page_numbers': page_numbers}), 200
	except Exception as e:
		return handle_error(e, 'Error processing query')

@app.route('/api/stop_tts', methods=['POST'])
@login_required
def stop_tts():
	global tts_process
	if tts_process and tts_process.is_alive():
		tts_process.terminate()
	return jsonify({'message': 'TTS stopped'}), 200


@app.route('/api/store_message/<int:chat_id>', methods=['POST'])
@login_required
def store_message(chat_id):
	data = request.get_json()
	query = data.get('query')
	response = data.get('response')

	if not query or not response:
		return jsonify({'message': 'Query and response are required'}), 400

	try:
		new_query_message = Messages(chat_id=chat_id, content=query, role=UserSystemEnum.USER)
		new_response_message = Messages(chat_id=chat_id, content=response, role=UserSystemEnum.MODEL)
		db.session.add(new_query_message)
		db.session.add(new_response_message)
		db.session.commit()
		return jsonify({'message': 'Messages stored successfully'}), 201
	except Exception as e:
		return handle_error(e, 'Error storing messages')


@app.route('/api/messages/<int:chat_id>', methods=['GET'])
@login_required
def get_messages(chat_id):
	try:
		messages = Messages.query.filter_by(chat_id=chat_id).order_by(Messages.created_at).all()
		return jsonify(
			[{'id': message.id, 'content': message.content, 'role': message.role.value} for message in messages]), 200
	except Exception as e:
		return handle_error(e, 'Error fetching messages')


@app.route('/api/delete_chat/<int:chat_id>', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
	try:
		# Fetch the chat details
		chat = Chats.query.filter_by(chat_id=chat_id, username=current_user.username).first()
		if not chat:
			return jsonify({'message': 'Chat not found'}), 404

		concatenated_file_names = ''
		for key in chat.file_keys:
			# Delete from S3
			# s3.delete_object(Bucket=os.getenv('PUBLIC_S3_BUCKET_NAME'), Key=key)

			concatenated_file_names += key
		namespace = hashlib.md5(concatenated_file_names.encode()).hexdigest()

		# Delete from Pinecone
		pinecone_index.delete(delete_all=True, namespace=namespace)

		# Delete from Neon DB
		Messages.query.filter_by(chat_id=chat_id).delete()
		db.session.delete(chat)
		db.session.commit()

		return jsonify({'message': 'Chat deleted successfully'}), 200
	except Exception as e:
		return handle_error(e, 'Error deleting chat')


@app.route('/')
def index():
	return 'BACKEND RUNNING woaaahhh!!!'


if __name__ == '__main__':
	app.run(debug=True)
