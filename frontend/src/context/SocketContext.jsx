import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (user) {
            // Since we are proxying, we don't need absolute URL
            const newSocket = io({
                path: '/socket.io',
                reconnectionAttempts: 5
            });

            newSocket.on('connect', () => {
                setIsConnected(true);
                newSocket.emit('join_user', user.id);
                console.log("Socket connected");
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error("Socket error:", err);
                setIsConnected(false);
                // toast.error("Real-time connection failed");
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
