# Antecedentes Personales y Familiares
## Campos detectados
alergiaAntibioticos
alergiaAnestesia
hemorragias
vihSida
tuberculosis
asma
diabetes
hipertension
enfermedadCardiaca
otros
Estructura recomendada
antecedentes: {
  alergias: {
    antibioticos,
    anestesia
  },
  enfermedades: {
    hemorragias,
    vih,
    tuberculosis,
    asma,
    diabetes,
    hipertension,
    cardiacas
  },
  otros,
  observaciones
}
## Restricción importante

NO usar:

strings tipo "sí/no"

Usar:

Boolean

Ejemplo:

diabetes: true