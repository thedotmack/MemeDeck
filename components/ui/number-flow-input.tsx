import NumberFlow from '@number-flow/react'
import clsx from 'clsx'
import { Minus, Plus } from 'lucide-react'
import * as React from 'react'

type Props = {
    value?: number
    min?: number
    max?: number
    onChange?: (value: number) => void
    format?: Intl.NumberFormatOptions
    prefix?: string
    suffix?: string
    step?: number
    className?: string
    useUSDDenominations?: boolean
}

export default function NumberFlowInput({ 
    value = 0, 
    min = -Infinity, 
    max = Infinity, 
    onChange,
    format,
    prefix,
    suffix,
    step = 1,
    className,
    useUSDDenominations = false
}: Props) {
    const defaultValue = React.useRef(value)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [animated, setAnimated] = React.useState(true)
    const [showCaret, setShowCaret] = React.useState(true)

    
    const USD_DENOMINATIONS = [1, 5, 10, 20, 50, 100, 200, 500, 1000]
    
    const getNextAmount = (current: number, direction: 'up' | 'down') => {
        const currentIndex = USD_DENOMINATIONS.findIndex(denom => denom >= current)
        
        if (direction === 'up') {
            return currentIndex < USD_DENOMINATIONS.length - 1 
                ? USD_DENOMINATIONS[currentIndex + 1] 
                : USD_DENOMINATIONS[USD_DENOMINATIONS.length - 1]
        } else {
            return currentIndex > 0 
                ? USD_DENOMINATIONS[currentIndex - 1] 
                : USD_DENOMINATIONS[0]
        }
    }

    const handleInput: React.ChangeEventHandler<HTMLInputElement> = ({ currentTarget: el }) => {
        setAnimated(false)
        let next = value
        if (el.value === '') {
            next = defaultValue.current
        } else {
            const num = el.valueAsNumber
            if (!isNaN(num) && min <= num && num <= max) next = num
        }
        el.value = String(next)
        onChange?.(next)
    }

    const handlePointerDown = (diff: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
        setAnimated(true)
        if (event.pointerType === 'mouse') {
            event?.preventDefault()
            inputRef.current?.focus()
        }
        
        let newVal: number
        if (useUSDDenominations) {
            newVal = getNextAmount(value, diff > 0 ? 'up' : 'down')
        } else {
            newVal = value + diff
        }
        
        newVal = Math.min(Math.max(newVal, min), max)
        onChange?.(newVal)
    }

    return (
        <div className={clsx(
            "group flex items-stretch rounded-md text-lg sm:text-xl font-semibold ring ring-zinc-700 transition-[box-shadow] focus-within:ring-2 focus-within:ring-green-500 bg-zinc-900/50",
            className
        )}>
            <button
                aria-hidden="true"
                tabIndex={-1}
                className="flex items-center px-2 sm:px-4 text-white/70 hover:text-white transition-colors disabled:opacity-30"
                disabled={!!(min != null && value <= min)}
                onPointerDown={handlePointerDown(-step)}
            >
                <Minus className="size-3 sm:size-4" strokeWidth={3} />
            </button>
            <div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap] min-w-8 sm:min-w-16">
                <input
                    ref={inputRef}
                    className={clsx(
                        showCaret ? 'caret-green-500' : 'caret-transparent',
                        'spin-hide bg-transparent py-1 sm:py-2 text-center font-[inherit] text-transparent outline-none'
                    )}
                    style={{ fontKerning: 'none' }}
                    type="number"
                    min={min}
                    step={step}
                    autoComplete="off"
                    inputMode="numeric"
                    max={max}
                    value={value}
                    onInput={handleInput}
                />
                <NumberFlow
                    value={value}
                    locales="en-US"
                    format={(format || { useGrouping: false }) as any}
                    prefix={prefix}
                    suffix={suffix}
                    aria-hidden="true"
                    animated={animated}
                    onAnimationsStart={() => setShowCaret(false)}
                    onAnimationsFinish={() => setShowCaret(true)}
                    className="pointer-events-none text-white"
                    willChange
                />
            </div>
            <button
                aria-hidden="true"
                tabIndex={-1}
                className="flex items-center px-2 sm:px-4 text-white/70 hover:text-white transition-colors disabled:opacity-30"
                disabled={!!(max != null && value >= max)}
                onPointerDown={handlePointerDown(step)}
            >
                <Plus className="size-3 sm:size-4" strokeWidth={3} />
            </button>
        </div>
    )
}