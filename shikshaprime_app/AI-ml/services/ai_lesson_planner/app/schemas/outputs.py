from pydantic import BaseModel, Field

from app.schemas.sections import (
    ActivitiesOutput,
    AssessmentOutput,
    DifferentiationOutput,
    TimeBreakdownOutput,
)


class LessonPlan(BaseModel):
    objectives: list[str] = Field(description="Learning objectives with Bloom's taxonomy verbs")
    prerequisites: list[str] = Field(description="Prerequisite knowledge and skills")
    materials: list[str] = Field(description="Required materials and resources")
    activities: ActivitiesOutput = Field(description="Five-phase lesson activities")
    assessment: AssessmentOutput = Field(description="Formative and summative assessment strategies")
    differentiation: DifferentiationOutput = Field(description="Differentiation for slow and advanced learners")
    homework: str = Field(description="Homework assignments")
    standards: list[str] = Field(description="Board-specific curriculum standards")
    timeBreakdown: TimeBreakdownOutput = Field(description="Time allocation across lesson phases")
