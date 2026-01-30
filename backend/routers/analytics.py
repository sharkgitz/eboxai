from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.analytics_service import analytics_service

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Get aggregated ROI, Trust, and Trend metrics for the dashboard.
    """
    return analytics_service.get_dashboard_stats(db)
