"use client";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/src/context/authContext";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader } from "@/components/ui/loader"
import Image from 'next/image';
import './login.css';
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import institutionLogo from "../../../public/institution-logo.jpg"

export default function LoginPage() {
  const { login } = useContext(AuthContext)!;
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("")
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Maintaining existing login call structure
      await login({ username, password });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(ua));
  }, []);

  return (
    <>
      <div className="login-board">
        {isLoading && <Loader />}
        <div className="login-header text-center">
          <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/logo.svg`} width={280} height={70} alt="ShikshaPrime" className="table mx-auto lg:lg-20 md:mb-3 mb-2" />
          {/* <h1 className="login-title">Login ShikshaPrime</h1> */}
          {/* <p className="login-subtitle">ShikshaPrime Education Platform</p> */}
        </div>
        <div className="flex items-center gap-10 login-panel">
          {!isMobile && <div className="institutionLogo">
            <Image src={institutionLogo} alt=""/>
            <p className="text-dark">Institution Name</p>
            <Link href="/online-registration" target="_blank" className="stu-registration">Student Registration</Link>
          </div>}
          <div className="login-card">
            <div className="form-group">
              <Label className="custom-label">User Name *</Label>
              <Input
                type="text"
                placeholder="Enter user name *"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="custom-input"
              />
            </div>

            <div className="form-group">
              <Label className="custom-label">Password *</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="custom-input"
              />
            </div>
            <Button variant={'primary'} className="submit-btn" onClick={handleLogin}>Submit</Button>
            <button className="forgotPassword" onClick={() => setIsForgotPasswordOpen(true)}>Forgot password?</button>
            {error && <p style={{ color: "#ff6b6b", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
          </div>
        </div>
        <p className="text-center text-white text-sm mt-20"> Copyright &copy; 2026, by <a href="https://retechprime.com/" target="_blank" className="footer-link">ReTechPrime Technology</a> Solutions Pvt. Ltd</p>
      </div>
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address below to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reset-email" className="text-right">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                className="col-span-3"
              />
            </div>
          </div>
          <Button type="submit">Send Reset Link</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
