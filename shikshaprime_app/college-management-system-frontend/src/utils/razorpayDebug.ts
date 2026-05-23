/**
 * Razorpay Debug Utilities
 * Use these functions to troubleshoot payment integration issues
 */

export class RazorpayDebugger {
  static logPaymentFlow(step: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔧 Razorpay Debug - ${step}:`, data);
  }

  static checkRazorpayAvailability(): boolean {
    const isAvailable = typeof window !== 'undefined' && !!window.Razorpay;
    this.logPaymentFlow('Razorpay Availability Check', {
      isAvailable,
      windowExists: typeof window !== 'undefined',
      razorpayExists: typeof window !== 'undefined' ? !!window.Razorpay : false,
      razorpayType: typeof window !== 'undefined' ? typeof window.Razorpay : 'undefined'
    });
    return isAvailable;
  }

  static validateOrderData(orderData: any): boolean {
    const requiredFields = ['razorpay_key_id', 'razorpay_order_id', 'amount'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    this.logPaymentFlow('Order Data Validation', {
      orderData,
      requiredFields,
      missingFields,
      isValid: missingFields.length === 0
    });

    return missingFields.length === 0;
  }

  static validateEnvironment() {
    const envVars = {
      BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN,
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
      NEXT_PUBLIC_RAZORPAY_ENABLED: process.env.NEXT_PUBLIC_RAZORPAY_ENABLED,
      NODE_ENV: process.env.NODE_ENV
    };

    this.logPaymentFlow('Environment Variables', envVars);
    return envVars;
  }

  static testRazorpayConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.checkRazorpayAvailability()) {
        // Try to load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          this.logPaymentFlow('Script Load Success', { loaded: true });
          resolve(true);
        };
        script.onerror = () => {
          this.logPaymentFlow('Script Load Failed', { error: 'Failed to load Razorpay script' });
          resolve(false);
        };
        document.head.appendChild(script);
      } else {
        this.logPaymentFlow('Razorpay Already Available', { alreadyLoaded: true });
        resolve(true);
      }
    });
  }

  static createTestRazorpayInstance(orderData: any): boolean {
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay not available');
      }

      const testOptions = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'Test Instance',
        description: 'Test Payment',
        order_id: orderData.razorpay_order_id,
        handler: function(response: any) {
          console.log('Test handler called:', response);
        },
        modal: {
          ondismiss: function() {
            console.log('Test modal dismissed');
          }
        }
      };

      const testInstance = new window.Razorpay(testOptions);
      this.logPaymentFlow('Test Instance Creation', { 
        success: true, 
        instance: !!testInstance 
      });
      
      return true;
    } catch (error) {
      this.logPaymentFlow('Test Instance Creation Failed', { 
        error: (error as Error).message,
        stack: (error as Error).stack
      });
      return false;
    }
  }

  static runFullDiagnostics(orderData?: any): Promise<DiagnosticResult> {
    return new Promise(async (resolve) => {
      const result: DiagnosticResult = {
        timestamp: new Date().toISOString(),
        environment: this.validateEnvironment(),
        razorpayAvailable: this.checkRazorpayAvailability(),
        scriptLoadable: false,
        orderDataValid: false,
        instanceCreatable: false,
        overallStatus: 'FAILED'
      };

      // Test script loading
      result.scriptLoadable = await this.testRazorpayConnection();

      // Test order data if provided
      if (orderData) {
        result.orderDataValid = this.validateOrderData(orderData);
        if (result.scriptLoadable && result.orderDataValid) {
          result.instanceCreatable = this.createTestRazorpayInstance(orderData);
        }
      }

      // Determine overall status
      if (result.scriptLoadable && result.razorpayAvailable) {
        if (!orderData) {
          result.overallStatus = 'READY_FOR_ORDER';
        } else if (result.orderDataValid && result.instanceCreatable) {
          result.overallStatus = 'READY_FOR_PAYMENT';
        } else {
          result.overallStatus = 'ORDER_DATA_ISSUES';
        }
      } else {
        result.overallStatus = 'SCRIPT_LOADING_ISSUES';
      }

      this.logPaymentFlow('Full Diagnostics Complete', result);
      resolve(result);
    });
  }
}

export interface DiagnosticResult {
  timestamp: string;
  environment: any;
  razorpayAvailable: boolean;
  scriptLoadable: boolean;
  orderDataValid: boolean;
  instanceCreatable: boolean;
  overallStatus: 'READY_FOR_PAYMENT' | 'READY_FOR_ORDER' | 'ORDER_DATA_ISSUES' | 'SCRIPT_LOADING_ISSUES' | 'FAILED';
}

// React Hook for Razorpay debugging
export function useRazorpayDebug() {
  const runDiagnostics = async (orderData?: any): Promise<DiagnosticResult> => {
    return RazorpayDebugger.runFullDiagnostics(orderData);
  };

  const checkAvailability = (): boolean => {
    return RazorpayDebugger.checkRazorpayAvailability();
  };

  const testConnection = async (): Promise<boolean> => {
    return RazorpayDebugger.testRazorpayConnection();
  };

  const validateOrder = (orderData: any): boolean => {
    return RazorpayDebugger.validateOrderData(orderData);
  };

  return {
    runDiagnostics,
    checkAvailability,
    testConnection,
    validateOrder
  };
}

// Common error codes and solutions
export const RAZORPAY_ERROR_SOLUTIONS = {
  'RAZORPAY_NOT_DEFINED': {
    description: 'Razorpay script not loaded',
    solutions: [
      'Check internet connection',
      'Verify script URL is accessible',
      'Try refreshing the page',
      'Check browser console for script loading errors'
    ]
  },
  'INVALID_KEY_ID': {
    description: 'Invalid or missing Razorpay key ID',
    solutions: [
      'Verify RAZORPAY_KEY_ID in backend environment',
      'Ensure API returns correct key_id',
      'Check if using test vs live keys correctly'
    ]
  },
  'INVALID_ORDER_ID': {
    description: 'Invalid or missing order ID',
    solutions: [
      'Verify order creation API is working',
      'Check order ID format (starts with order_)',
      'Ensure order is not expired'
    ]
  },
  'PAYMENT_CANCELLED': {
    description: 'User cancelled payment',
    solutions: [
      'This is normal user behavior',
      'Provide option to retry payment',
      'Keep payment order valid for retry'
    ]
  },
  'VERIFICATION_FAILED': {
    description: 'Payment signature verification failed',
    solutions: [
      'Check RAZORPAY_KEY_SECRET in backend',
      'Verify signature generation algorithm',
      'Ensure all required parameters are sent'
    ]
  }
};