from typing import Optional

from pydantic import BaseModel, Field


class ObjectivesOutput(BaseModel):
    objectives: list[str] = Field(description="4-6 learning objectives starting with Bloom's taxonomy verbs")


class PrerequisitesOutput(BaseModel):
    prerequisites: list[str] = Field(description="3-5 prerequisite knowledge items required for this lesson")


class MaterialsOutput(BaseModel):
    materials: list[str] = Field(description="5-8 materials and resources: physical aids, digital, handouts")


class ActivitiesOutput(BaseModel):
    intro: str = Field(description="Opening hook (~10% of duration) — connects to prior knowledge, states objectives")
    instruction: str = Field(description="Core teaching (~35%) — step-by-step explanation referencing materials")
    guidedPractice: str = Field(description="Teacher-led practice (~20%) — think-pair-share, class-wide problems")
    independentPractice: str = Field(description="Student-led work (~25%) — alone or groups, teacher monitors")
    closure: str = Field(description="Recap (~10%) — check understanding, preview homework")


class AssessmentOutput(BaseModel):
    formative: str = Field(description="Quick in-class check (2-3 min) — thumbs up/down, oral quiz, exit ticket")
    summative: str = Field(description="End-of-lesson assessment — 3-5 actual questions written out, each mapping to an objective")


class DifferentiationOutput(BaseModel):
    slowLearners: str = Field(description="3+ concrete strategies for struggling students — scaffolding, simplified versions, peer pairing")
    advancedLearners: str = Field(description="3+ concrete strategies for advanced students — extension, higher-order questions, real-world applications")


class HomeworkOutput(BaseModel):
    homework: str = Field(description="2-3 specific written-out homework tasks extending the lesson (20-30 min for grade level)")


class StandardsOutput(BaseModel):
    standards: list[str] = Field(description="3-5 board-specific learning outcomes referencing the topic and board curriculum")


class TimeBreakdownOutput(BaseModel):
    intro: int = Field(ge=1, description="Minutes for intro phase (~10% of duration)")
    instruction: int = Field(ge=1, description="Minutes for instruction phase (~30-35%)")
    guidedPractice: int = Field(ge=1, description="Minutes for guided practice (~20%)")
    independentPractice: int = Field(ge=1, description="Minutes for independent practice (~25%)")
    closure: int = Field(ge=1, description="Minutes for closure phase (~10%)")


class ChapterContext(BaseModel):
    concepts: list[str] = Field(description="Key concepts extracted from the chapter")
    definitions: list[str] = Field(description="Important definitions from the chapter")
    examples: list[str] = Field(description="Examples used in the chapter")
    exercises: list[str] = Field(description="Exercises copied verbatim from the chapter")
    subtopics: list[str] = Field(description="Subtopics covered in the chapter")
    learningFlow: Optional[str] = Field(default=None, description="How the chapter progresses from basic to advanced")
