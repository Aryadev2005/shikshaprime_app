import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message?: string;
    isLoading?: boolean;
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    message = "Are you sure you want to delete this? This action cannot be undone.",
    isLoading = false,
}: ConfirmModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="max-w-[420px] p-0 overflow-hidden rounded-[1rem] border-none shadow-2xl"
            >
                <DialogTitle className="hidden">Confirm Action</DialogTitle>

                {/* Header */}
                <div className="bg-gradient-to-b from-[#941B74] to-[#2D2050] px-8 py-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-white hover:opacity-80 transition-opacity cursor-pointer p-1.5 rounded-full hover:bg-white/10"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mx-auto mb-3">
                        <AlertTriangle size={28} className="text-white" />
                    </div>
                    <h2 className="text-white text-lg font-bold tracking-wide">Are you sure?</h2>
                </div>

                {/* Body */}
                <div className="px-8 py-6 text-center bg-white">
                    <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

                    <div className="flex items-center justify-center gap-4 mt-6">
                        <Button
                            variant="primary"
                            className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                        {isLoading ? "Executing..." : "Yes"}
                        </Button>
                        <Button
                            variant="ghost"
                            className="min-w-[100px] border border-gray-300 text-gray-600 hover:bg-gray-50"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmModal;