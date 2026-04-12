import sys
from main import _predict, lifespan, _detect_signals
import asyncio

async def test():
    class DummyApp:
        pass
    
    app = DummyApp()
    
    async with lifespan(app):
        queries = [
            "Hey Rahul, let's meet up today at 6pm for dinner. Bring Rs 500",
            "Congratulations you have won a $1000 prize. Call 1-800-CLAIM to receive.",
            "Please click here to verify your account http://secure.xyz/login?id=123",
            "Are we still on for the 8 AM standup meeting?",
            "Mom I need money urgently send me Rs 5000 via UPI",
            "Your order has been delivered.",
            "URGENT: Verify your KYC for HDFC Bank before it gets blocked. Click here http://bit.ly/123",
        ]
        
        for q in queries:
            print(f"Query: {q}")
            res = _predict(q)
            signals = res['signals']
            print(f"Label: {res['label']}, Fraud Prob: {res['fraud_probability']:.4f}, Signals: {signals}")
            print()

if __name__ == "__main__":
    asyncio.run(test())
