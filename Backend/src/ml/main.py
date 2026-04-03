import os
import pandas as pd
import joblib
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from contextlib import asynccontextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "electricity_benchmark_model.pkl")

# --- 1. Define Constants ---

# Emission factor (kg CO2 per kWh)
# Average grid emission factor for India is ~0.82 - 0.9, but we'll use your 0.384 or a standard 0.85
ELECTRICITY_FACTOR_KWH = 0.384 

VEHICLE_FACTORS_PER_KM = {
    'Car': 0.248,
    'Motorcycle': 0.114,
    'Scooter': 0.114,
    'E-Bike': 0.077,
    'Bicycle': 0.0,
    'Three-Wheeler': 0.150,
    'Other': 0.248
}

AVERAGE_MONTHLY_TRAVEL_CO2 = 150.0  # (kg) benchmark

# --- 2. Define Pydantic Models ---

class ElectricityData(BaseModel):
    homeType: str
    carpetArea_sqft: float
    monthly_unitsUsed_kwh: float = 0.0
    monthly_solarUsed_kwh: float = 0.0

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "homeType": "Apartment",
                "carpetArea_sqft": 1200.0,
                "monthly_unitsUsed_kwh": 0.0,
                "monthly_solarUsed_kwh": 350.0
            }
        }
    )

class TravelData(BaseModel):
    vehicle_type: str
    kmCovered: float

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "vehicle_type": "Car",
                "kmCovered": 250.0
            }
        }
    )

# --- 3. App Lifecycle ---

app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Initializing GreenLens AI Engine...")
    try:
        if os.path.exists(MODEL_PATH):
            app_state["electricity_model"] = joblib.load(MODEL_PATH)
            print("✅ ML Model loaded successfully.")
        else:
            print("⚠️ Warning: Model file not found. Using fallback logic.")
            app_state["electricity_model"] = None
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        app_state["electricity_model"] = None
    
    yield
    app_state.clear()
    print("🛑 Shutting down AI Engine...")

app = FastAPI(lifespan=lifespan)

# --- 4. API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "online", "engine": "GreenLens Modular ML"}

@app.post("/calculate-electricity")
def calculate_electricity_footprint(data: ElectricityData):
    """
    Calculates CO2 impact by comparing net grid usage against an ML-predicted benchmark.
    Solar generation acts as a direct reduction (offset) of the footprint.
    """
    # 1. Calculate the user's actual grid footprint vs their solar offset
    grid_co2 = data.monthly_unitsUsed_kwh * ELECTRICITY_FACTOR_KWH
    solar_offset = data.monthly_solarUsed_kwh * ELECTRICITY_FACTOR_KWH
    
    # The actual carbon impact sent back to the dashboard
    actual_net_co2 = max(0, grid_co2 - solar_offset)

    # 2. Get the ML Benchmark (Expected CO2 for a similar house)
    model = app_state.get("electricity_model")
    
    if model:
        try:
            # Predict how much a house of this type/size usually consumes
            features_df = pd.DataFrame({
                'homeType': [data.homeType],
                'carpetArea_sqft': [data.carpetArea_sqft]
            })
            expected_co2 = float(model.predict(features_df).item())
        except Exception as e:
            print(f"Prediction error: {e}")
            expected_co2 = 200.0 # Standard fallback
    else:
        # Fallback logic if model file is missing
        expected_co2 = (data.carpetArea_sqft / 10) * ELECTRICITY_FACTOR_KWH

    # 3. Token Award Logic
    # Users earn tokens if their net CO2 is below the benchmark
    tokens_to_award = 0
    if actual_net_co2 < expected_co2:
        co2_saved = expected_co2 - actual_net_co2
        # Base 10 tokens + bonus for every kg of CO2 saved
        tokens_to_award = 10 + int(co2_saved * 0.1)

    return {
        "status": "success",
        "user_co2_footprint_kg": round(actual_net_co2, 2),
        "solar_offset_kg": round(solar_offset, 2),
        "benchmark_co2_kg": round(expected_co2, 2),
        "tokens_awarded": tokens_to_award
    }

@app.post("/calculate-travel")
def calculate_travel_footprint(data: TravelData):
    vehicle_factor = VEHICLE_FACTORS_PER_KM.get(data.vehicle_type, VEHICLE_FACTORS_PER_KM['Other'])
    actual_co2 = data.kmCovered * vehicle_factor
    expected_co2 = AVERAGE_MONTHLY_TRAVEL_CO2

    tokens_to_award = 0
    if actual_co2 < expected_co2:
        co2_saved = expected_co2 - actual_co2
        tokens_to_award = 10 + int(co2_saved * 0.1)

    return {
        "status": "success",
        "user_co2_footprint_kg": round(actual_co2, 2),
        "tokens_awarded": tokens_to_award
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)