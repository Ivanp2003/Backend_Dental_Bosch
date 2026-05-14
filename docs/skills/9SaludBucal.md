# Indicadores de Salud Bucal
## Campos detectados
    Higiene oral simplificada
    placa
    cálculo
    gingivitis
Enfermedad periodontal
leve
moderada
severa
Maloclusión
angle I
angle II
angle III
Fluorosis
leve
moderada
severa
Índice CPO-ceo
D
C
P
O
total
## Estructura recomendada
indicadoresSaludBucal: {
  higieneOral: {
    placa,
    calculo,
    gingivitis
  },
  enfermedadPeriodontal,
  maloclusion,
  fluorosis,
  indiceCPO
}
## Restricción

Todos los indicadores deben ser:

opcionales

Porque no siempre aplican.