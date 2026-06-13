import React, { useState } from 'react'
import { createOrder, verifyPayment } from '../services/payment.api'
import './SubscriptionModal.scss'

const SubscriptionModal = ({ isOpen, onClose, onCreditsAdded }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true)
                return
            }
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    const handlePlanSelect = async (plan) => {
        setLoading(true)
        setError("")

        try {
            const scriptLoaded = await loadRazorpayScript()
            if (!scriptLoaded) {
                setError("Failed to load payment gateway. Please try again.")
                setLoading(false)
                return
            }

            // Create order on backend
            const orderData = await createOrder({ plan })
            const { order, keyId } = orderData

            const planLabel = plan === "monthly" ? "Monthly" : "Yearly"
            const planAmount = plan === "monthly" ? "₹399" : "₹2,999"
            const creditsToAdd = plan === "monthly" ? "100" : "1,200"

            const options = {
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                name: "GP-GeniusPilot",
                description: `${planLabel} Plan - ${planAmount} (${creditsToAdd} credits)`,
                order_id: order.id,
                handler: async function (response) {
                    // Verify payment on backend
                    try {
                        const verifyData = await verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            plan
                        })

                        if (onCreditsAdded) {
                            onCreditsAdded(verifyData.credits, verifyData.subscriptionPlan, verifyData.subscriptionExpiry)
                        }

                        onClose()
                    } catch (verifyErr) {
                        setError("Payment verification failed. Please contact support.")
                    } finally {
                        setLoading(false)
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false)
                    }
                },
                prefill: {
                    contact: '',
                    email: ''
                },
                theme: {
                    color: '#6366f1'
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.on('payment.failed', function (response) {
                setError(`Payment failed: ${response.error.description}`)
                setLoading(false)
            })
            razorpay.open()

        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.")
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="subscription-overlay" onClick={onClose}>
            <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
                <button className="subscription-modal__close" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="subscription-modal__header">
                    <div className="subscription-modal__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                    </div>
                    <h2>Upgrade Your Plan</h2>
                    <p>You're running low on credits! Choose a plan to continue generating interview plans.</p>
                </div>

                {error && (
                    <div className="subscription-modal__error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="subscription-modal__plans">
                    {/* Monthly Plan */}
                    <div className="plan-card">
                        <div className="plan-card__badge">Popular</div>
                        <h3 className="plan-card__title">Monthly</h3>
                        <div className="plan-card__price">
                            <span className="plan-card__amount">₹399</span>
                            <span className="plan-card__period">/month</span>
                        </div>
                        <ul className="plan-card__features">
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                100 Credits
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                AI Interview Analysis
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Resume PDF Download
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Study Progress Tracking
                            </li>
                        </ul>
                        <button
                            className="plan-card__btn plan-card__btn--monthly"
                            onClick={() => handlePlanSelect('monthly')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Subscribe Monthly'}
                        </button>
                    </div>

                    {/* Yearly Plan */}
                    <div className="plan-card plan-card--featured">
                        <div className="plan-card__badge plan-card__badge--best">Best Value</div>
                        <h3 className="plan-card__title">Yearly</h3>
                        <div className="plan-card__price">
                            <span className="plan-card__amount">₹2,999</span>
                            <span className="plan-card__period">/year</span>
                        </div>
                        <div className="plan-card__savings">Save ₹1,789 (37% off)</div>
                        <ul className="plan-card__features">
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                1,200 Credits
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                AI Interview Analysis
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Resume PDF Download
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Study Progress Tracking
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Priority Support
                            </li>
                        </ul>
                        <button
                            className="plan-card__btn plan-card__btn--yearly"
                            onClick={() => handlePlanSelect('yearly')}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Subscribe Yearly'}
                        </button>
                    </div>
                </div>

                <p className="subscription-modal__footer-text">
                    Secure payment powered by Razorpay. You can cancel anytime.
                </p>
            </div>
        </div>
    )
}

export default SubscriptionModal