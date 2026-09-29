import { useContext } from 'react';
import { AuthFormContext } from './AuthFormContext';

export const useAuthForm = () => useContext(AuthFormContext);
