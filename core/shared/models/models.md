# Modelos Compartidos del Proyecto

Este documento describe la estructura y organización de los modelos compartidos utilizados en el proyecto. Los modelos están implementados usando `mongoengine` para interactuar con MongoDB y se encuentran en el directorio `core/shared/models/`.

## Estructura General

Cada modelo extiende de `me.Document` y utiliza campos específicos de MongoDB, como `ObjectIdField`, `StringField`, `ReferenceField`, entre otros. Todos los modelos relevantes incluyen campos de auditoría como `created_at` y `updated_at`.

## Principales Modelos

### Organization (`org.py`)
Representa una organización dentro del sistema. Incluye información como nombre, alias único, descripción, logo, segmentos, usuarios asociados, plan de suscripción y fechas de creación/actualización.

### User (`user.py`)
Define los usuarios del sistema y sus atributos principales. (No incluido en los adjuntos, pero referenciado por otros modelos.)

### Agent (`agents.py`)
Modela los agentes que interactúan con usuarios a través de diferentes proveedores (WhatsApp, Telegram, Email, Instagram) y modelos de IA (GPT, Claude, Gemini). Cada agente está vinculado a una organización.

### Gamification (`gamification.py`)
Incluye modelos para gamificación:
- **Tag**: Etiquetas para categorizar elementos.
- **PointsSystem**: Sistemas de puntos para recompensas.
- **Task**: Tareas que pueden ser asignadas a usuarios.
- **Incentive**: Incentivos o recompensas.
- **Function**: Funciones ejecutables por el sistema.
- **Trigger**: Disparadores para eventos automáticos.
- **Loop**: Ciclos de tareas, incentivos y funciones, asociados a organizaciones y usuarios.

### Tasks (`tasks.py`)
Extiende el modelo `Task` para definir encuestas (`Survey`) con preguntas, opciones y tipo de respuesta.

## Relaciones Entre Modelos

- **Organization** se relaciona con **User** y **Agent**.
- **Loop** se relaciona con **Tag**, **Trigger**, **Task**, **Incentive**, **Function**, **Organization** y **User**.
- **Survey** hereda de **Task**.

## Convenciones

- Todos los modelos usan `ObjectIdField` como identificador único.
- Se emplean listas y referencias para modelar relaciones entre entidades.
- Los campos `created_at` y `updated_at` permiten rastrear la creación y modificación de los documentos.

## Ejemplo de Uso

Para crear una organización y un agente asociado:

```python
org = Organization(name="Mi Org", alias="mi_org", plan="basic").save()
agent = Agent(provider="whatsapp", model="gpt-4", provider_id="12345", name="Agente1", organization=org).save()