// /**
//  * PaymentModal Component - Razorpay Integration
//  * Based on the comprehensive guide for opening Razorpay payment interface
//  */

// "use client";
// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';

// // Extend window interface for Razorpay
// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// interface StudentData {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   registrationId?: string;
//   className?: string;
//   feeType?: string;
// }

// interface PaymentModalProps {
//   show: boolean;
//   onHide: () => void;
//   amount: number;
//   studentData: StudentData;
//   paymentOrderData?: any; // Razorpay order data from backend
//   onPaymentSuccess: (response: any, registrationId?: string) => void;
//   onPaymentError: (error: string) => void;
// }

// const PaymentModal: React.FC<PaymentModalProps> = ({
//   show,
//   onHide,
//   amount,
//   studentData,
//   paymentOrderData,
//   onPaymentSuccess,
//   onPaymentError,
// }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [paymentSuccess, setPaymentSuccess] = useState(false);
//   const [registrationId, setRegistrationId] = useState<string>('');

//   // Load Razorpay script dynamically
//   const loadRazorpay = (): Promise<boolean> => {
//     return new Promise((resolve) => {
//       if (window.Razorpay) {
//         resolve(true);
//         return;
//       }

//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.onload = () => {
//         console.log('✅ Razorpay script loaded successfully');
//         resolve(true);
//       };
//       script.onerror = () => {
//         console.error('❌ Failed to load Razorpay script');
//         resolve(false);
//       };
//       document.body.appendChild(script);
//     });
//   };

//   // Core payment handler function
//   const handlePayment = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       // Step 1: Load Razorpay script dynamically
//       const res = await loadRazorpay();
//       if (!res) {
//         setError('Failed to load payment gateway. Please refresh and try again.');
//         setLoading(false);
//         return;
//       }

//       // Step 2: Validate payment order data
//       if (!paymentOrderData) {
//         setError('Payment order not initialized. Please try again.');
//         setLoading(false);
//         return;
//       }

//       if (!paymentOrderData.razorpay_key_id || !paymentOrderData.razorpay_order_id) {
//         setError('Invalid payment configuration. Please contact support.');
//         setLoading(false);
//         return;
//       }

//       // Step 3: Configure Razorpay options
//       const options = {
//         key: paymentOrderData.razorpay_key_id,                    // Razorpay key from backend
//         amount: paymentOrderData.amount * 100,                    // Amount in paise
//         currency: paymentOrderData.currency || 'INR',             // Currency
//         name: 'ShikshaPrime',                                     // Business name
//         description: `${paymentOrderData.fee_type || 'Registration'} Fee Payment`,
//         image: '/images/logo.svg',                                // Company logo
//         order_id: paymentOrderData.razorpay_order_id,             // Order ID from Razorpay
        
//         // SUCCESS HANDLER - Most Important Part
//         handler: async function (response: any) {
//           console.log('🎉 Payment successful, verifying...', response);
//           try {
//             // Step 4: Verify payment on backend
//             const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/identity/sr/payments/verify`, {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 payment_id: paymentOrderData.payment_id,
//               }),
//             });

//             const verifyData = await verifyResponse.json();

//             if (verifyData.status === 1) {
//               // Step 5: Payment successful - update UI
//               setRegistrationId(verifyData.data?.receipt_no || 'Unknown');
//               setPaymentSuccess(true);
//               setLoading(false);
//               onPaymentSuccess(response, verifyData.data?.receipt_no);
//             } else {
//               throw new Error(verifyData.message || 'Payment verification failed');
//             }
//           } catch (error: any) {
//             console.error('❌ Payment verification error:', error);
//             setLoading(false);
//             onPaymentError(error.message || 'Payment verification failed');
//           }
//         },
        
//         // PRE-FILLED CUSTOMER DATA
//         prefill: {
//           name: `${studentData.firstName} ${studentData.lastName}`,
//           email: studentData.email,
//           contact: studentData.phone,
//         },
        
//         // ADDITIONAL METADATA
//         notes: {
//           student_id: studentData.id,
//           registration_id: studentData.registrationId,
//           class: studentData.className,
//           fee_type: studentData.feeType,
//         },
        
//         // UI CUSTOMIZATION
//         theme: {
//           color: '#007bff',
//           backdrop_color: 'rgba(0,0,0,0.6)',
//         },
        
//         // MODAL BEHAVIOR
//         modal: {
//           ondismiss: function () {
//             console.log('❌ Payment modal dismissed by user');
//             setLoading(false);
//             setError('Payment cancelled by user');
//           },
//           confirm_close: true,
//           animation: true,
//         },
        
//         timeout: 600, // 10 minutes
//         remember_customer: false,
//       };

//       console.log('🚀 Creating Razorpay instance with options:', {
//         ...options,
//         handler: '[Function]',
//       });

//       // Step 6: CREATE AND OPEN RAZORPAY INTERFACE
//       const paymentObject = new window.Razorpay(options);
      
//       console.log('✅ Razorpay instance created successfully');
//       console.log('🎯 Opening Razorpay payment modal...');
      
//       paymentObject.open();  // 🚀 THIS LINE OPENS THE RAZORPAY MODAL
      
//       console.log('🎉 Razorpay modal opened successfully!');
//       setLoading(false);
      
//     } catch (error: any) {
//       console.error('💥 Payment error:', error);
//       setError(error.message || 'Payment failed. Please try again.');
//       setLoading(false);
//       onPaymentError(error.message || 'Payment failed');
//     }
//   };

//   if (!show) return null;

//   // Success state UI
//   if (paymentSuccess) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//         <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
//           <div className="text-center">
//             <div className="text-green-500 text-6xl mb-4">✅</div>
//             <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
//             <p className="text-gray-600 mb-4">
//               Your payment of ₹{amount} has been processed successfully.
//             </p>
//             {registrationId && (
//               <p className="text-sm text-gray-500 mb-6">
//                 Transaction ID: {registrationId}
//               </p>
//             )}
//             <Button onClick={onHide} className="w-full">
//               Continue
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Payment modal UI
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
//           <button
//             onClick={onHide}
//             className="text-gray-400 hover:text-gray-600 text-2xl"
//             disabled={loading}
//           >
//             ×
//           </button>
//         </div>

//         <div className="space-y-4">
//           {/* Student Details */}
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
//             <div className="space-y-1 text-sm text-gray-800">
//               <p><span className="font-medium text-gray-900">Student:</span> {studentData.firstName} {studentData.lastName}</p>
//               <p><span className="font-medium text-gray-900">Email:</span> {studentData.email}</p>
//               <p><span className="font-medium text-gray-900">Phone:</span> {studentData.phone}</p>
//               {studentData.registrationId && (
//                 <p><span className="font-medium text-gray-900">Registration ID:</span> {studentData.registrationId}</p>
//               )}
//               {studentData.feeType && (
//                 <p><span className="font-medium text-gray-900">Fee Type:</span> {studentData.feeType}</p>
//               )}
//             </div>
//           </div>

//           {/* Amount */}
//           <div className="bg-blue-50 p-4 rounded-lg">
//             <h3 className="font-semibold text-blue-700 mb-2">Amount Payable</h3>
//             <p className="text-2xl font-bold text-blue-600">₹{amount.toFixed(2)}</p>
//           </div>

//           {/* Error Display */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
//               <p className="text-sm">{error}</p>
//             </div>
//           )}

//           {/* Payment Button */}
//           <Button 
//             onClick={handlePayment}    // 👈 This triggers the payment flow
//             disabled={loading || !paymentOrderData}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center"
//           >
//             {loading && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//             )}
//             <i className="fas fa-credit-card mr-2"></i>
//             {loading ? 'Processing...' : `Pay ₹${amount}`}
//           </Button>

//           {/* Security Notice */}
//           <div className="text-xs text-gray-500 text-center">
//             <p>🔒 Secure payment powered by Razorpay</p>
//             <p>Your payment information is encrypted and secure</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentModal;

/**
 * PaymentModal Component - Razorpay Integration
 * Based on the comprehensive guide for opening Razorpay payment interface
 */

"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '@/src/utils/tenantUrlBuilder';
import { useTenant } from '@/src/hooks/useTenant';

// Extend window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface StudentData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationId?: string;
  className?: string;
  feeType?: string;
}

interface PaymentModalProps {
  show: boolean;
  onHide: () => void;
  amount: number;
  studentData: StudentData;
  paymentOrderData?: any; // Razorpay order data from backend
  onPaymentSuccess: (response: any, registrationId?: string) => void;
  onPaymentError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  onHide,
  amount,
  studentData,
  paymentOrderData,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<string>('');
  const tenant = useTenant();

  // Load Razorpay script dynamically
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('✅ Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Core payment handler function
  const handlePayment = async () => {
    if (!tenant) return;
    setLoading(true);
    setError('');

    try {
      // Step 1: Load Razorpay script dynamically
      const res = await loadRazorpay();
      if (!res) {
        setError('Failed to load payment gateway. Please refresh and try again.');
        setLoading(false);
        return;
      }

      // Step 2: Validate payment order data
      if (!paymentOrderData) {
        setError('Payment order not initialized. Please try again.');
        setLoading(false);
        return;
      }

      if (!paymentOrderData.razorpay_key_id || !paymentOrderData.razorpay_order_id) {
        setError('Invalid payment configuration. Please contact support.');
        setLoading(false);
        return;
      }

      // Check if PhonePe payment URL is available (new PhonePe integration)
      if (paymentOrderData.phonepe_payment_url) {
        console.log('🔗 PhonePe payment URL found, redirecting...');
        // Store transaction details for callback handling
        sessionStorage.setItem('phonepe_transaction', JSON.stringify({
          merchantTransactionId: paymentOrderData.razorpay_order_id,
          paymentId: paymentOrderData.payment_id,
          registrationId: studentData.id,
          amount: paymentOrderData.amount,
          timestamp: Date.now()
        }));
        
        // Redirect to PhonePe payment page
        window.location.href = paymentOrderData.phonepe_payment_url;
        setLoading(false);
        return;
      }

      // Fallback to Razorpay for backward compatibility
      console.log('🎯 Using Razorpay payment flow');

      // Step 3: Configure Razorpay options
      const options = {
        key: paymentOrderData.razorpay_key_id,                    // Razorpay key from backend
        amount: paymentOrderData.amount * 100,                    // Amount in paise
        currency: paymentOrderData.currency || 'INR',             // Currency
        name: 'ShikshaPrime',                                     // Business name
        description: `${paymentOrderData.fee_type || 'Registration'} Fee Payment`,
        image: `${process.env.NEXT_PUBLIC_BASE_PATH}/images/logo.svg`,                                // Company logo
        order_id: paymentOrderData.razorpay_order_id,             // Order ID from Razorpay
        
        // SUCCESS HANDLER - Most Important Part
        handler: async function (response: any) {
          console.log('🎉 Payment successful, verifying...', response);
          try {
            // Step 4: Verify payment on backend
            const url = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), '/api/identity/sr/payments/verify');
            const verifyResponse = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_id: paymentOrderData.payment_id,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.status === 1) {
              // Step 5: Payment successful - update UI
              setRegistrationId(verifyData.data?.receipt_no || 'Unknown');
              setPaymentSuccess(true);
              setLoading(false);
              onPaymentSuccess(response, verifyData.data?.receipt_no);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('❌ Payment verification error:', error);
            setLoading(false);
            onPaymentError(error.message || 'Payment verification failed');
          }
        },
        
        // PRE-FILLED CUSTOMER DATA
        prefill: {
          name: `${studentData.firstName} ${studentData.lastName}`,
          email: studentData.email,
          contact: studentData.phone,
        },
        
        // ADDITIONAL METADATA
        notes: {
          student_id: studentData.id,
          registration_id: studentData.registrationId,
          class: studentData.className,
          fee_type: studentData.feeType,
        },
        
        // UI CUSTOMIZATION
        theme: {
          color: '#007bff',
          backdrop_color: 'rgba(0,0,0,0.6)',
        },
        
        // MODAL BEHAVIOR
        modal: {
          ondismiss: function () {
            console.log('❌ Payment modal dismissed by user');
            setLoading(false);
            setError('Payment cancelled by user');
          },
          confirm_close: true,
          animation: true,
        },
        
        timeout: 600, // 10 minutes
        remember_customer: false,
      };

      console.log('🚀 Creating Razorpay instance with options:', {
        ...options,
        handler: '[Function]',
      });

      // Step 6: CREATE AND OPEN RAZORPAY INTERFACE
      const paymentObject = new window.Razorpay(options);
      
      console.log('✅ Razorpay instance created successfully');
      console.log('🎯 Opening Razorpay payment modal...');
      
      paymentObject.open();  // 🚀 THIS LINE OPENS THE RAZORPAY MODAL
      
      console.log('🎉 Razorpay modal opened successfully!');
      setLoading(false);
      
    } catch (error: any) {
      console.error('💥 Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setLoading(false);
      onPaymentError(error.message || 'Payment failed');
    }
  };

  if (!show) return null;

  // Success state UI
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment of ₹{amount} has been processed successfully.
            </p>
            {registrationId && (
              <p className="text-sm text-gray-500 mb-6">
                Transaction ID: {registrationId}
              </p>
            )}
            <Button onClick={onHide} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment modal UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
          <button
            onClick={onHide}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Student Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm text-gray-800">
              <p><span className="font-medium text-gray-900">Student:</span> {studentData.firstName} {studentData.lastName}</p>
              <p><span className="font-medium text-gray-900">Email:</span> {studentData.email}</p>
              <p><span className="font-medium text-gray-900">Phone:</span> {studentData.phone}</p>
              {studentData.registrationId && (
                <p><span className="font-medium text-gray-900">Registration ID:</span> {studentData.registrationId}</p>
              )}
              {studentData.feeType && (
                <p><span className="font-medium text-gray-900">Fee Type:</span> {studentData.feeType}</p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">Amount Payable</h3>
            <p className="text-2xl font-bold text-blue-600">₹{amount.toFixed(2)}</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Payment Button */}
          <Button 
            onClick={handlePayment}    // 👈 This triggers the payment flow
            disabled={loading || !paymentOrderData}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <i className="fas fa-credit-card mr-2"></i>
            {loading ? 'Processing...' : `Pay ₹${amount}`}
          </Button>

          {/* Security Notice */}
          <div className="text-xs text-gray-500 text-center">
            <p>🔒 Secure payment powered by Razorpay</p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
