# 📊 PRESUPUESTO OPERATIVO RENTIK - EL SALVADOR

**Fecha:** Noviembre 2025  
**Proyecto:** Plataforma de Renta de Vehículos P2P  
**Mercado:** El Salvador (iOS + Android)

---

## 🔴 COSTOS OBLIGATORIOS MENSUALES

### 1. Cuentas de Desarrollador

| Servicio | Costo | Frecuencia | Mensual |
|----------|-------|------------|---------|
| Apple Developer Program | $99 | Anual | $8.25 |
| Google Play Console | $25 | Único (Año 1) | $2.08 |
| **Subtotal** | | | **$10.33** |

---

### 2. Firebase (Backend as a Service)

#### Plan Spark (Gratuito) - Límites:
- ✅ 50,000 lecturas Firestore/día
- ✅ 20,000 escrituras Firestore/día
- ✅ 5GB almacenamiento
- ✅ 10GB transferencia/mes
- ⚠️ **NO incluye Cloud Functions** (necesarias para Stripe)

#### Plan Blaze (Recomendado - Pago por uso):

| Servicio | Precio | Uso Estimado | Costo |
|----------|--------|--------------|-------|
| Firestore Lecturas | $0.06 / 100k | 500k-1M/mes | $3-6 |
| Firestore Escrituras | $0.18 / 100k | 100k-300k/mes | $2-5 |
| Storage (fotos/docs) | $0.026 / GB | 10-50 GB | $0.26-1.30 |
| Bandwidth (descarga) | $0.12 / GB | 20-100 GB | $2.40-12 |
| Cloud Functions | $0.40 / 1M invocaciones | 50k-200k/mes | $0.02-0.08 |
| Cloud Functions tiempo | $0.0000025 / GB-segundo | Variable | $5-15 |

**Fases de Crecimiento:**
- **Inicio (0-100 usuarios):** $25-35/mes
- **Crecimiento (100-500 usuarios):** $80-120/mes
- **Escalado (500-1000 usuarios):** $150-250/mes

---

### 3. Stripe (Procesamiento de Pagos)

**Modelo de Cobro:**
- Sin cuota mensual fija ✅
- **Transacciones estándar:** 2.9% + $0.30 por cargo exitoso
- **Stripe Connect:** 0.25% adicional por transferencia a arrendadores
- **Retiros a bancos salvadoreños:** 
  - ACH internacional: $0.25-2.00 por transferencia
  - Puede tomar 2-5 días hábiles

**Ejemplos de Costos:**

| Monto Renta | Fee Stripe (2.9% + $0.30) | Connect (0.25%) | Total Fee | Neto Arrendador |
|-------------|---------------------------|-----------------|-----------|-----------------|
| $30/día | $1.17 | $0.08 | $1.25 | $28.75 |
| $50/día | $1.75 | $0.13 | $1.88 | $48.12 |
| $100/día | $3.20 | $0.25 | $3.45 | $96.55 |

**Proyección Mensual (100 rentas):**
- Volumen: $5,000
- Fees totales: ~$180 (3.6% efectivo)

---

### 4. Validación de Licencias (OCR/IA)

Tu aplicación requiere validar licencias de conducir al registro.

#### Opción A: Google Cloud Vision API (Recomendado)

| Concepto | Precio | Estimado Mensual |
|----------|--------|------------------|
| OCR + Detección docs | $1.50 / 1,000 imágenes | $5-20 |
| Primeras 1,000/mes | GRATIS | $0 |
| Validación facial (opcional) | $1.50 / 1,000 | $5-15 |

**Características:**
- ✅ Extrae texto de DUI/Licencias
- ✅ Detecta documentos falsificados
- ✅ 99%+ precisión
- ✅ API en español

**Proyección:**
- 50 registros/mes: **$0** (dentro del tier gratis)
- 200 registros/mes: **$10**
- 500 registros/mes: **$20**

#### Opción B: AWS Textract

| Concepto | Precio |
|----------|--------|
| Detección de texto | $1.50 / 1,000 páginas |
| Análisis de documentos ID | $50 / 1,000 páginas |

**Más costoso pero mayor precisión para documentos oficiales.**

#### Opción C: Validación Manual (Arranque)

**Costo:** $0 técnico  
**Tiempo:** 2-5 min por licencia  
**Viable hasta:** ~50 usuarios/mes  
**Recomendado para:** Primeros 3 meses de beta

---

### 5. Google Maps Platform

Tu app usa:
- Maps SDK (mostrar vehículos en mapa)
- Places API (búsqueda de direcciones)
- Geocoding API (coordenadas)

**Crédito Mensual:** $200 gratis

| Servicio | Precio después del crédito | Uso Típico | Costo |
|----------|----------------------------|------------|-------|
| Maps SDK for Mobile | $7 / 1,000 cargas | 5k-20k/mes | $0-$84 |
| Places API Autocomplete | $2.83 / 1,000 requests | 2k-10k/mes | $0-$14 |
| Geocoding API | $5 / 1,000 requests | 1k-5k/mes | $0-$10 |

**Proyección:**
- **Inicio (crédito $200 cubre):** $0/mes
- **Crecimiento (500+ usuarios):** $30-60/mes
- **Escalado (1000+ usuarios):** $80-150/mes

---

## 🟡 COSTOS OPCIONALES RECOMENDADOS

### 6. Notificaciones Push

**Firebase Cloud Messaging:** ✅ **GRATIS ILIMITADO**

Alternativas:
- OneSignal: Gratis hasta 10,000 suscriptores
- Pusher: Desde $49/mes

---

### 7. Monitoreo y Analytics

| Servicio | Plan | Costo |
|----------|------|-------|
| Firebase Analytics | Gratis | $0 ✅ |
| Firebase Crashlytics | Gratis | $0 ✅ |
| Firebase Performance | Gratis | $0 ✅ |
| Sentry (errores avanzados) | 5k eventos/mes | $0 (gratis) |
| Sentry (escalado) | 50k eventos/mes | $26 |

**Recomendación inicial:** Usar solo servicios gratuitos de Firebase.

---

### 8. Verificación SMS (2FA/Notificaciones)

**Firebase Phone Authentication:**
- $0.01 por verificación SMS
- Primeras 10k/mes incluidas en plan Blaze
- Operadores en El Salvador: Tigo, Claro, Movistar

**Twilio (Alternativa):**
- SMS a El Salvador: $0.0085 por mensaje
- WhatsApp Business API: $0.005-0.01 por mensaje

**Proyección:**
- 100 verificaciones/mes: $0 (dentro de Firebase)
- 500 verificaciones/mes: $5
- 1000 verificaciones/mes: $10

---

### 9. Email Transaccional

Para confirmaciones de reserva, recordatorios, recibos.

#### SendGrid (Recomendado)

| Plan | Emails/mes | Costo |
|------|-----------|-------|
| Free | 100/día (3,000/mes) | $0 |
| Essentials | 50,000/mes | $19.95 |
| Pro | 100,000/mes | $89.95 |

**Firebase Extension - Trigger Email:** GRATIS con API de SendGrid

**Proyección:**
- Inicio: $0 (plan gratuito suficiente)
- Crecimiento (500 usuarios): $19.95
- Escalado (1000+ usuarios): $89.95

---

### 10. Hosting Web / Landing Page

**Firebase Hosting:**
- 10 GB almacenamiento: GRATIS
- 360 MB/día transferencia: GRATIS
- Después: $0.026/GB almacenamiento, $0.15/GB transferencia
- SSL incluido ✅

**Alternativas:**
- Vercel: Gratis para proyectos personales
- Netlify: 100GB/mes gratis
- **Estimado:** $0-10/mes

---

### 11. Dominio

| TLD | Registro Anual | Renovación | Mensual |
|-----|----------------|------------|---------|
| .com | $12-15 | $15-20 | $1.25 |
| .sv | $25-35 | $25-35 | $2.50 |
| .app | $20-25 | $20-25 | $2.00 |

**Recomendación:** rentik.com + rentik.sv

**Proveedores:**
- Namecheap
- Google Domains
- GoDaddy

---

### 12. Certificado SSL

✅ **Let's Encrypt: GRATIS**  
✅ **Firebase Hosting incluye SSL automático**

---

## 🔵 COSTOS OPERATIVOS Y ADMINISTRATIVOS

### 13. Soporte al Cliente

#### Opción A: WhatsApp Business App
- **Costo:** GRATIS ✅
- **Límite:** Manual, 1 operador
- **Viable hasta:** 200 usuarios activos

#### Opción B: WhatsApp Business API
- **Costo:** $0.01 por mensaje (conversación)
- **Setup:** $100-300 inicial (Meta Business)
- **Plataforma:** Twilio ($0.005/msg adicional)

#### Opción C: Zendesk
- **Support Team:** $55/agente/mes
- **Suite Team:** $89/agente/mes
- Incluye: Chat, Email, Teléfono

#### Opción D: Intercom
- **Starter:** $74/mes
- **Pro:** $395/mes
- Incluye: Chat en vivo, Bots

**Recomendación Fase 1:** WhatsApp Business App (gratis)

---

### 14. Legal y Cumplimiento (El Salvador)

| Concepto | Costo Único | Notas |
|----------|-------------|-------|
| Términos y Condiciones | $200-500 | Abogado especializado |
| Política de Privacidad (GDPR/CCPA) | $200-500 | Incluye cookies |
| Contrato de Arrendamiento Modelo | $300-600 | Template legal |
| Registro de Marca (.sv) | $150-300 | CNR El Salvador |
| Registro de Empresa (SA/SRL) | $500-1,500 | Notario + trámites |
| Seguro Responsabilidad Civil | Consultar | Aseguradoras locales |

**Total Legal (Setup):** $1,350-3,400

---

### 15. Marketing Digital (El Salvador)

#### Facebook/Instagram Ads

| Presupuesto Mensual | Alcance Estimado | CPM | Conversiones |
|---------------------|------------------|-----|--------------|
| $200 | 40,000-80,000 personas | $2.50-5 | 50-100 registros |
| $500 | 100,000-200,000 personas | $2.50-5 | 150-300 registros |
| $1,000 | 250,000+ personas | $2.50-5 | 400-600 registros |

#### Google Ads (Search + Display)

| Presupuesto | Clicks | CPC Promedio | Conversiones |
|-------------|--------|--------------|--------------|
| $300 | 300-600 | $0.50-1 | 30-60 registros |
| $800 | 800-1,600 | $0.50-1 | 100-200 registros |

#### Influencers Locales (El Salvador)

| Tier | Seguidores | Costo/Post | Alcance |
|------|-----------|-----------|---------|
| Micro | 10k-50k | $100-300 | 5k-20k |
| Mid | 50k-200k | $500-1,500 | 20k-100k |
| Macro | 200k+ | $2,000-5,000 | 100k+ |

---

## 💰 RESUMEN EJECUTIVO DE COSTOS

### FASE 1: LANZAMIENTO (Meses 1-3)
**Objetivo:** 0-100 usuarios activos

| Categoría | Servicio | Mensual |
|-----------|----------|---------|
| **Obligatorios** |
| Developers | Apple + Google | $10.33 |
| Backend | Firebase Blaze (bajo uso) | $30.00 |
| Pagos | Stripe (sin cuota) | $0.00 |
| Validación | Manual (gratis) | $0.00 |
| Maps | Google (crédito $200) | $0.00 |
| **Opcionales** |
| Dominio | .com | $1.25 |
| Email | SendGrid Free | $0.00 |
| Hosting | Firebase | $0.00 |
| Notificaciones | FCM | $0.00 |
| Soporte | WhatsApp | $0.00 |
| **TOTAL BASE** | | **$41.58/mes** |

**+ Costos Variables:**
- Stripe: 3.1% de transacciones procesadas
- SMS (si se activa): $0.01 por verificación

**+ Costos Únicos (Setup):**
- Legal: $1,350-3,400
- Marketing inicial: $500-1,500
- **Total único:** $1,850-4,900

---

### FASE 2: CRECIMIENTO (Meses 4-9)
**Objetivo:** 100-500 usuarios activos

| Categoría | Servicio | Mensual |
|-----------|----------|---------|
| Developers | Apple + Google | $10.33 |
| Backend | Firebase Blaze | $80.00 |
| Validación | Google Cloud Vision | $15.00 |
| Maps | Google Platform | $20.00 |
| SMS | Firebase Auth | $10.00 |
| Email | SendGrid Essentials | $19.95 |
| Monitoreo | Firebase + Sentry | $0.00 |
| Soporte | WhatsApp Business | $0.00 |
| Marketing | Facebook Ads | $300.00 |
| **TOTAL** | | **$455.28/mes** |

**+ Variables:**
- Stripe: ~$150-300/mes en fees (100-200 rentas)
- **Total con transacciones:** $605-755/mes

---

### FASE 3: ESCALADO (Meses 10-12)
**Objetivo:** 500-1,500 usuarios activos

| Categoría | Servicio | Mensual |
|-----------|----------|---------|
| Developers | Apple + Google | $10.33 |
| Backend | Firebase Blaze | $200.00 |
| Validación | Cloud Vision | $40.00 |
| Maps | Google Platform | $80.00 |
| SMS | Firebase Auth | $30.00 |
| Email | SendGrid Pro | $89.95 |
| Monitoreo | Sentry | $26.00 |
| Soporte | Zendesk (1 agente) | $55.00 |
| Marketing | Ads + Influencers | $800.00 |
| **TOTAL** | | **$1,331.28/mes** |

**+ Variables:**
- Stripe: ~$500-900/mes (300-600 rentas)
- **Total con transacciones:** $1,831-2,231/mes

---

## 📈 PROYECCIÓN ANUAL COMPLETA

### Año 1 - Desglose Trimestral

| Trimestre | Usuarios | Costos Fijos | Stripe Fees | Marketing | Total Mensual | Total Trimestral |
|-----------|----------|--------------|-------------|-----------|---------------|------------------|
| Q1 (1-3) | 0-100 | $42 | $50 | $200 | $292 | $876 |
| Q2 (4-6) | 100-300 | $145 | $200 | $400 | $745 | $2,235 |
| Q3 (7-9) | 300-600 | $165 | $400 | $600 | $1,165 | $3,495 |
| Q4 (10-12) | 600-1000 | $531 | $700 | $800 | $2,031 | $6,093 |
| **TOTAL AÑO 1** | | | | | | **$12,699** |

**+ Costos Únicos Año 1:**
- Legal y Setup: $2,000
- **Total Año 1:** $14,699

---

### Proyección Años 2-3

**Año 2 (1,000-3,000 usuarios):**
- Costos mensuales: $2,000-3,500
- **Total anual:** $24,000-42,000

**Año 3 (3,000-10,000 usuarios):**
- Costos mensuales: $4,000-8,000
- **Total anual:** $48,000-96,000

---

## ⚠️ COSTOS OCULTOS Y CONSIDERACIONES

### 1. Comisiones Bancarias (El Salvador)

| Concepto | Costo |
|----------|-------|
| Stripe → Banco local | $2-5 por transferencia |
| Comisión banco receptor | 0.5-1% adicional |
| Retención ISR (si aplica) | 10-30% según ingreso |
| IVA servicios digitales | 13% sobre algunos servicios |

### 2. Impuestos y Regulaciones

**IVA (13% El Salvador):**
- Servicios de software: Sujeto a IVA
- Comisiones de plataforma: Sujeto a IVA
- Debes registrarte como contribuyente si superas $5,715/mes

**Impuesto sobre la Renta:**
- Ganancias empresariales: 25-30%
- Retención en origen: 10% en algunos casos

### 3. Mantenimiento y Actualizaciones

| Concepto | Frecuencia | Costo/Hora | Estimado Anual |
|----------|-----------|-----------|----------------|
| Actualizaciones iOS/Android | Trimestral | - | $1,000-2,000 |
| Nuevas features | Mensual | $50-100 | $2,000-4,000 |
| Bug fixes críticos | Ad-hoc | $50-100 | $500-1,500 |
| Mantenimiento Firebase | Mensual | - | $0 (incluido) |

### 4. Contingencias Técnicas

**Reserva 15-20% del presupuesto para:**
- Picos de tráfico inesperados
- Aumento de costos Firebase
- Migraciones de base de datos
- Incidentes de seguridad
- Downtime y pérdidas

---

## 🎯 ESTRATEGIA DE OPTIMIZACIÓN DE COSTOS

### Mes 1-3: Modo Supervivencia ($42/mes)

**Activar:**
- ✅ Firebase Spark (gratis) con migración programada a Blaze mes 2
- ✅ Validación manual de licencias (ahorra $15/mes)
- ✅ WhatsApp Business App para soporte
- ✅ SendGrid plan gratis (3k emails/mes)

**Desactivar:**
- ❌ SMS verificación (solo email)
- ❌ Monitoreo pago
- ❌ Marketing pago inicial (orgánico + referidos)

**Ahorro:** ~$200/mes

---

### Mes 4-6: Crecimiento Controlado ($455/mes)

**Activar:**
- ✅ Firebase Blaze con alertas de presupuesto
- ✅ Google Cloud Vision para validación
- ✅ SendGrid Essentials
- ✅ Marketing Facebook Ads moderado ($300/mes)

**Monitorear:**
- Límites de Firebase (alertas en 80%)
- ROI de marketing (costo por adquisición)
- Tasa de conversión registro → renta

---

### Mes 7-12: Escalar con Datos ($1,331/mes)

**Decisiones basadas en métricas:**
- Si CAC < $20 → Aumentar marketing
- Si retención > 40% → Invertir en features
- Si soporte > 5 hrs/día → Contratar agente

---

## 📊 MÉTRICAS CLAVE PARA MONITOREAR

### Métricas Financieras

| Métrica | Fórmula | Meta Mes 6 | Meta Año 1 |
|---------|---------|------------|------------|
| CAC (Costo Adquisición Cliente) | Marketing / Nuevos usuarios | < $25 | < $15 |
| LTV (Valor Vida Cliente) | Avg renta × Frecuencia × Meses | > $100 | > $300 |
| LTV/CAC Ratio | LTV / CAC | > 4:1 | > 6:1 |
| Margen Operativo | (Ingresos - Costos) / Ingresos | 10% | 25% |
| Burn Rate | Costos mensuales | < $600 | < $1,500 |

### Métricas Técnicas (Costos)

| Métrica | Alerta | Acción |
|---------|--------|--------|
| Firebase lecturas/día | > 40k | Cachear queries |
| Firebase escrituras/día | > 15k | Batch operations |
| Storage usado | > 80% plan | Comprimir imágenes |
| Cloud Functions tiempo | > 1 min avg | Optimizar código |
| Maps API requests | > crédito $200 | Implementar cacheo |

---

## 🚀 HOJA DE RUTA DE IMPLEMENTACIÓN

### Semana 1-2: Setup Inicial ($0)

- [ ] Crear cuenta Firebase (Spark)
- [ ] Configurar Apple Developer
- [ ] Configurar Google Play Console
- [ ] Setup Stripe Connect
- [ ] Configurar Google Maps API
- [ ] Registrar dominio .com/.sv
- [ ] Configurar SendGrid (plan gratis)
- [ ] Setup WhatsApp Business

**Costo:** $122 únicos (developers + dominio)

---

### Semana 3-4: Pre-lanzamiento ($42/mes)

- [ ] Migrar Firebase a Blaze
- [ ] Configurar alertas de presupuesto
- [ ] Implementar analytics
- [ ] Setup Crashlytics
- [ ] Validación manual de licencias
- [ ] Testing con beta testers (20-50)

**Costo mensual:** $42

---

### Mes 2-3: Soft Launch ($200-455/mes)

- [ ] Lanzamiento iOS App Store
- [ ] Lanzamiento Google Play Store
- [ ] Activar Cloud Vision (validación)
- [ ] Marketing orgánico (redes sociales)
- [ ] Primeras 100 campañas Facebook Ads
- [ ] Monitoreo diario de costos

**Costo mensual:** $200-300

---

### Mes 4-6: Growth Hacking ($455-755/mes)

- [ ] Programa de referidos
- [ ] Influencers locales (micro)
- [ ] Google Ads (keywords locales)
- [ ] Optimizar conversión registro
- [ ] A/B testing features
- [ ] Escalar marketing según ROI

**Costo mensual:** $455-755

---

### Mes 7-12: Escalar ($1,331-2,231/mes)

- [ ] Contratar soporte dedicado
- [ ] Expandir a ciudades secundarias
- [ ] Partnerships con flotas locales
- [ ] Implementar programa de lealtad
- [ ] Escalar infraestructura según demanda

**Costo mensual:** $1,331-2,231

---

## 💡 RECOMENDACIONES FINALES

### Para Inicio (Primeros 3 meses)

1. **Minimizar costos fijos:** Usar solo servicios gratuitos/freemium
2. **Validación manual:** Ahorra $180/año inicial
3. **Marketing orgánico:** Instagram, TikTok, grupos Facebook SV
4. **Beta cerrada:** 50 usuarios para feedback antes de ads

### Para Crecimiento (Meses 4-9)

1. **Monitoreo estricto:** Dashboard de costos semanal
2. **Automatizar validación:** ROI positivo a partir de 100 registros/mes
3. **Marketing data-driven:** Solo escalar canales con LTV/CAC > 3:1
4. **Optimizar código:** Revisar Firebase usage mensual

### Para Escalar (Meses 10-12)

1. **Contratar equipo:** 1 soporte + 1 marketing cuando factures $10k/mes
2. **Infraestructura robusta:** Monitoreo 24/7, backups automatizados
3. **Expandir mercado:** Considerar Guatemala/Honduras (bajo costo adicional)
4. **Diversificar ingresos:** Seguros, gasolina, extras

---

## 📞 CONTACTOS ÚTILES (EL SALVADOR)

### Servicios Legales
- **CNR (Registro Marcas):** www.cnr.gob.sv
- **Ministerio de Hacienda (IVA):** www.mh.gob.sv

### Proveedores Tecnológicos
- **Firebase Support:** firebase.google.com/support
- **Stripe El Salvador:** stripe.com/global (via Panamá)
- **Google Cloud:** cloud.google.com/contact

### Marketing Digital
- **Facebook Business:** business.facebook.com
- **Google Ads El Salvador:** ads.google.com

---

## 📋 CHECKLIST DE CONTROL DE COSTOS

### Diario
- [ ] Revisar alertas Firebase
- [ ] Monitorear transacciones Stripe
- [ ] Verificar logs de errores (Crashlytics)

### Semanal
- [ ] Dashboard de métricas clave
- [ ] Revisar CAC por canal
- [ ] Analizar tasa de conversión

### Mensual
- [ ] Facturación Firebase vs presupuesto
- [ ] ROI de marketing
- [ ] Proyección siguiente mes
- [ ] Optimización de código (si costos > 10% proyección)

### Trimestral
- [ ] Auditoría completa de servicios
- [ ] Renegociar/cambiar proveedores
- [ ] Proyección financiera siguiente trimestre
- [ ] Actualizar precios si es necesario

---

## 🎯 PUNTOS DE DECISIÓN CLAVE

### ¿Cuándo activar servicios pagos?

| Servicio | Activar cuando... | Costo Incremental |
|----------|-------------------|-------------------|
| Firebase Blaze | Día 1 (Stripe necesita Functions) | +$30/mes |
| Cloud Vision OCR | > 50 registros/mes | +$15/mes |
| SendGrid pago | > 3,000 emails/mes | +$20/mes |
| SMS verificación | Fraude > 5% o requiere 2FA | +$10/mes |
| Soporte pago | > 200 usuarios activos | +$55/mes |
| Monitoreo avanzado | Facturación > $5k/mes | +$26/mes |

### ¿Cuándo escalar marketing?

**Regla de oro:** Solo aumentar presupuesto si:
- LTV/CAC > 3:1
- Retención mes 1 > 30%
- Tasa conversión registro→renta > 20%

---

## 📄 RESUMEN EJECUTIVO

### Inversión Mínima Requerida

**Setup inicial (Año 0):**
- Desarrollo: $0 (ya está hecho)
- Legal: $1,350-3,400
- Developers: $122
- **Total:** $1,472-3,522

**Operación primer año:**
- Costos operativos: $12,699
- Marketing: $6,000
- Contingencia (20%): $3,740
- **Total:** $22,439

**INVERSIÓN TOTAL AÑO 1: $23,911-25,961**

### Punto de Equilibrio

**Supuestos:**
- Comisión plataforma: 15% por renta
- Renta promedio: $50/día × 3 días = $150
- Comisión Rentik: $22.50 por renta

**Punto de equilibrio mensual:**
- Costos mes 6: $755
- Rentas necesarias: 34 rentas/mes
- Usuarios activos necesarios: ~100 (34% conversión)

**Break-even:** Mes 7-9

---

## 🔗 RECURSOS ADICIONALES

### Documentación Técnica
- Firebase Pricing: firebase.google.com/pricing
- Stripe Pricing: stripe.com/pricing
- Google Cloud Vision: cloud.google.com/vision/pricing

### Calculadoras
- Firebase Calculator: firebase.google.com/pricing#blaze-calculator
- Stripe Fee Calculator: stripefee.com
- CAC/LTV Calculator: omni calculator.com/finance/customer-acquisition-cost

### Comunidades
- Firebase Community: firebase.google.com/community
- Stripe Developers: stripe.com/docs
- El Salvador Tech: (grupos Facebook/LinkedIn)

---

**Documento generado:** Noviembre 2025  
**Próxima revisión:** Después de primeros 3 meses operación  
**Contacto:** [Tu información de contacto]

---

## 📌 NOTAS FINALES

Este presupuesto asume:
- ✅ Aplicación ya desarrollada (costo $0 en desarrollo adicional)
- ✅ 1 fundador/desarrollador (sin salario inicial)
- ✅ Operación desde El Salvador
- ✅ Lanzamiento iOS + Android simultáneo
- ✅ Modelo de comisión (no suscripción)

**Factores que pueden aumentar costos:**
- ❌ Desarrollo de features nuevas
- ❌ Contratación de equipo
- ❌ Expansión a otros países
- ❌ Marketing agresivo (> $1k/mes)
- ❌ Soporte 24/7

**Oportunidades de reducción:**
- ✅ Validación manual inicial (-$180/año)
- ✅ Marketing orgánico (-$3,600/año)
- ✅ Hosting en Firebase (-$120/año vs VPS)
- ✅ No contratar equipo año 1 (-$12,000+)

---

¿Necesitas ayuda implementando alertas de costos en Firebase o configurando dashboards de métricas?
