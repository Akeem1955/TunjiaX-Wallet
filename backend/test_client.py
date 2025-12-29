import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8080/ws/voice-stream"
    try:
        async with websockets.connect(uri) as websocket:
            # Test 1: Invalid NUBAN
            print("\nTest 1: Sending Invalid NUBAN ('1234')")
            await websocket.send(json.dumps({"text": "My account number is 1234"}))
            response = await websocket.recv()
            print(f"Response: {response}")

            # Test 2: Known Beneficiary (Bisola)
            print("\nTest 2: Sending Known Beneficiary ('Transfer 5k to Bisola')")
            await websocket.send(json.dumps({"text": "Transfer 5k to Bisola"}))
            response = await websocket.recv()
            print(f"Response: {response}")
            
             # Test 3: Biometric Trigger Path (Bisola + Opay)
            print("\nTest 3: Sending Complete Info ('Transfer 5k to Bisola Opay')")
            await websocket.send(json.dumps({"text": "Transfer 5k to Bisola Opay"}))
            response = await websocket.recv()
            print(f"Response: {response}")

            # Test 4: Unknown Beneficiary (Emeka)
            print("\nTest 4: Sending Unknown Beneficiary ('Transfer to Emeka')")
            await websocket.send(json.dumps({"text": "Transfer to Emeka"}))
            response = await websocket.recv()
            print(f"Response: {response}")

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
