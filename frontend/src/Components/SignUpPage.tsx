import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import styles from './styles/AuthPage.module.css';
import toast from 'react-hot-toast';

interface FormData {
    username: string;
    password: string;
    email: string;
}

function SignUpForm() {
    const { register, handleSubmit } = useForm<FormData>();
    const navigate = useNavigate();

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            const response = await fetch('/api/sign_up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                console.log('Sign up successful');
                toast.success(result.message);
                navigate('/sign-in');
            } else {
                console.log('Sign up failed');
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error during sign up:', error);
            toast.error('An error occurred. Please try again.');
        }
    };

    return (
        <div className={`${styles.authPage} d-flex flex-column justify-content-center align-items-center`} style={{height:'100vh'}}>
            <div className={'rounded-4 p-5 shadow-lg'}>
                <p className={'display-5'}>
                    <strong>Sign up</strong>
                    <small className={'text-muted h3 mx-2'}> for a new account</small>
                </p>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="email" className={'form-label'}>Email</label>
                        <input type='email'  className={'form-control'} id="email" {...register('email', {
                            required: true,
                            minLength:10,
                            maxLength: 25
                        })} />
                    </div>
                    <div>
                        <label htmlFor="username" className={'form-label'}>Username</label>
                        <input className={'form-control'} id="username" {...register('username', {
                            required: true,
                            minLength: 3,
                            maxLength: 20
                        })} />
                    </div>
                    <div>
                        <label htmlFor="password" className={'form-label'}>Password</label>
                        <input className={'form-control'} id="password" type="password" {...register('password', {
                            required: true,
                            minLength: 8,
                            maxLength: 20,
                            pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/
                        })} />
                        <div className="form-text">
                            Your password must be 8-20 characters long, contain letters and numbers, and must not
                            contain spaces, special characters, or emoji.
                        </div>
                    </div>
                    <div className={'d-flex justify-content-center'}>
                        <button type="submit" className={'btn btn-primary mt-3 w-50'}>Sign Up</button>
                    </div>
                </form>
                <p className="mt-3">
                    Already have an account? <span className="text-primary" style={{cursor: 'pointer'}} onClick={() => navigate('/sign-in')}>Sign in</span>
                </p>
            </div>
        </div>
    );
}

export default SignUpForm;