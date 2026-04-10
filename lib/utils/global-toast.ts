
interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

type ToastFunction = (options: ToastOptions) => void


let globalToastFunction: ToastFunction | null = null

export function registerGlobalToast(toastFn: ToastFunction): void {
  globalToastFunction = toastFn
}

function showGlobalToast(options: ToastOptions): void {
  if (globalToastFunction) {
    globalToastFunction(options)
  } else {
    
    console.warn('[Global Toast]', `${options.title}: ${options.description || ''}`)
  }
}

export const globalToast = {
  success: (title: string, description?: string) => 
    showGlobalToast({ title, description, variant: 'success' }),
    
  error: (title: string, description?: string) => 
    showGlobalToast({ title, description, variant: 'error' }),
    
  warning: (title: string, description?: string) => 
    showGlobalToast({ title, description, variant: 'warning' }),
    
  info: (title: string, description?: string) => 
    showGlobalToast({ title, description, variant: 'default' }),
    
  custom: (options: ToastOptions) => 
    showGlobalToast(options)
}