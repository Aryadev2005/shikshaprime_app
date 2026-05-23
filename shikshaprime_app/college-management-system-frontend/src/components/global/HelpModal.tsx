"use client";
import React from "react";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import { Phone, Mail, X } from "lucide-react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-[450px] p-0 overflow-hidden rounded-[1rem] border-none shadow-2xl">
                {/* Hidden title for accessibility */}
                <DialogTitle className="hidden">Help Center</DialogTitle>
                {/* Header */}
                <div className="bg-gradient-to-b from-[#941B74] to-[#2D2050] px-12 py-8 text-center relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-white hover:opacity-80 transition-opacity cursor-pointer p-2">
                        <X size={25} strokeWidth={2} />
                    </button>
                    <h2 className="text-white text-4xl font-bold tracking-tighter mb-2">GET IN TOUCH!</h2>
                    <p className="text-white text-lg font-normal">Always within your reach</p>
                    <div className="mt-10 mb-0 flex justify-center items-center">
                        <div className="relative w-56 h-20 flex justify-center items-center">
                            <div className="relative flex items-end">
                                <div className="w-24 h-20 rounded-xl rotate-[-15deg] flex items-center justify-center">
                                    {/* <Mail className="text-[#3A80D2]" size={40} strokeWidth={1.5} /> */}
                                    <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/help-center-icon.svg`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white px-8 py-8">
                    <div className="space-y-10">
                        <div className="flex items-center gap-5">
                            <Phone className="w-10 h-10 text-primary" strokeWidth={1} />
                            <div>
                                <p className="text-md font-medium text-gray-800">Call Us</p>
                                <p className="text-xl font-semibold">+91 62893 56967</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <Mail className="w-10 h-10 text-primary" strokeWidth={1} />
                            <div>
                                <p className="text-md font-medium text-gray-800">Mail Us</p>
                                <p className="text-xl font-semibold">
                                    info@retechprime.com
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};