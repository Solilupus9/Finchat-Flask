import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import styles from './styles/AuthPage.module.css';
import toast from 'react-hot-toast';

interface FormData {
    username: string;
    password: string;
}

function SignInForm() {
    const { register, handleSubmit } = useForm<FormData>();
    const navigate = useNavigate();
    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            const response = await fetch('/api/sign_in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                console.log('Login successful:'+result.message);
                toast.success(result.message);
                navigate('/');
            } else {
                console.log('Login failed:'+result.message);
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error during sign in:', error);
            toast.error('An error occurred. Please try again later.');
        }
    };

    return (
        <div className={`${styles.authPage} d-flex flex-column justify-content-center align-items-center`} style={{height:'100vh'}}>
            <div className={' rounded-4 p-5 shadow-lg'}>
                <p className={'display-5'}>
                    <strong>Sign in</strong>
                    <small className={'text-muted h3 mx-2'}> to your account</small>
                </p>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="username" className={'form-label'}>Username</label>
                        <input className={'form-control'} id="username" {...register('username', {required: true, minLength: 3, maxLength: 20})} />
                    </div>
                    <div>
                        <label htmlFor="password" className={'form-label'}>Password</label>
                        <input className={'form-control'} id="password"
                               type="password" {...register('password', {
                            required: true,
                            pattern: {
                                value: /^[A-Za-z0-9]{8,20}$/,
                                message: "Password must be 8-20 characters long and contain only letters and numbers."
                            },
                            minLength: 8,
                            maxLength: 20
                        })} />
                        <div className="form-text">
                            Your password must be 8-20 characters long, contain letters and numbers, and must not
                            contain spaces, special characters, or emoji.
                        </div>
                    </div>
                    <div className={'d-flex justify-content-center'}>
                        <button type="submit" className={'btn btn-primary mt-3 w-50'}>Sign In</button>
                    </div>
                </form>
                <p className="mt-3">
                    No account? <span className="text-primary" style={{cursor: 'pointer'}}
                                      onClick={() => navigate('/sign-up')}>Sign up</span>
                </p>
            </div>

        </div>
    );
}

export default SignInForm;