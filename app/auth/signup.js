import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignupRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login screen (which has both login and signup tabs)
        router.replace('/auth/login');
    }, []);

    return null;
}
