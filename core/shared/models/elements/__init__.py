from .tasks.info import Info
from .tasks.quiz import Quiz
from .element import Element
from .router.route import Route
from .tasks.task import BaseTask
from .tasks.survey import Survey
from .element_tag import ElementTag
from .functions.tagger import Tagger
from .triggers.trigger import Trigger
from .functions.function import Function
from .triggers.onArrival import OnArrival
from .tasks.questions.question import Question
from .incentives.incentive import BaseIncentive
from .functions.tagRules.tagRule import TagRule
from .router.element_router import ElementRouter
from .unsubscriber.unsubscriber import Unsubscriber
from .fixed_message.fixed_message import FixedMessage
from .incentives.coins_incentive import CoinsIncentive
from .incentives.badge_incentive import BadgeIncentive
from .incentives.points_incentive import PointsIncentive
from .tasks.questions.possible_answer import PossibleAnswer
from .incentives.store_item_incentive import StoreItemIncentive
# Esto asegura que todas las clases se registren automáticamente
__all__ = [
    'Info',
    'Quiz',
    'Route',
    'Survey',
    'Tagger',
    'Element',
    'Trigger',
    'TagRule',
    'Question',
    'Function',
    'BaseTask',
    'OnArrival',
    'ElementTag',
    'FixedMessage',
    'Unsubscriber',
    'ElementRouter',
    'BaseIncentive',
    'PossibleAnswer',
    'CoinsIncentive',
    'BadgeIncentive',
    'PointsIncentive',
    'StoreItemIncentive'
]