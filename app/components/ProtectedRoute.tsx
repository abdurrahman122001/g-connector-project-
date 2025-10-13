// components/ProtectedRoute.tsx
import React, { ReactElement, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Router } from 'react-router-dom';
import { RootState } from '../../store/store'; // adjust this path to where your store type is defined
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isLoggedIn = useSelector((state: RootState) => state.UserLogin.status);
  const router = useRouter();

  // useEffect(() => {
  //   if (!isLoggedIn) {
  //     router.push('/');
  //   }
  // }, [isLoggedIn, router]);

  // if (!isLoggedIn) {
  //   return null; // or a loading spinner
  // }

  return children;
};
