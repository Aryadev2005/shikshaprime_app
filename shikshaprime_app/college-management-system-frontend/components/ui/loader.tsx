import React from 'react';
import { Loader2 } from 'lucide-react';
import "./loader.css";

export const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white/3 p-4 rounded-lg flex flex-col items-center gap-2">
                <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/loader.svg`} alt="Loading..." className='loader-spine' />
            </div>
        </div>
    );
};
