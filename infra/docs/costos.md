# Costos y plan de apagado de la infraestructura (TVH-48)

Documento del Bloque C. Describe **qué recursos de `infra/` generan cobro**, la estimación
horaria/mensual, cómo apagar la infraestructura fuera de la demo y la revisión previa a la
presentación.

> **Advertencia sobre cifras.** Los importes son **estimaciones aproximadas** (precios públicos de
> AWS us-east-1 y tipo de cambio de referencia) y solo sirven para dimensionar el gasto. **Verifica
> siempre los precios vigentes** en la calculadora de AWS y en **Billing → Cost Explorer** antes de
> tomar decisiones. Las horas de cada mes (≈730) y los impuestos pueden variar el total.

## 1. Recursos facturables del proyecto

La infraestructura definida en `infra/main.tf` crea los siguientes recursos con coste:

| Recurso | Definición en Terraform | Cobro |
|---|---|---|
| **EKS control plane** | `modules/eks` (`aws_eks_cluster`) | **$0.10/h** por cluster (≈ $73/mes) |
| **EC2 del node group** | `modules/eks` (`aws_eks_node_group`), `t3.medium` × 1–3 nodos (desired 2) | Por instancia/hora + EBS de arranque |
| **DocumentDB** | `modules/docdb` (`aws_docdb_cluster` + `aws_docdb_cluster_instance`, `db.t3.medium`) | Por instancia/hora + almacenamiento + backup |
| **NAT Gateway** | `modules/vpc` (`aws_nat_gateway`) | **$0.045/h** + tráfico procesado por GB |
| **EIP del NAT** | `modules/vpc` (`aws_eip.nat`) | Gratis mientras esté asociada al NAT |
| **ALB (Ingress)** | Aprovisionado por AWS Load Balancer Controller (`modules/lbc`) | **$0.0225/h** + LCU/hora |
| **CloudWatch** | `modules/cloudwatch` (logs, alarmas, dashboard) | Ingesta/almacenamiento de logs + alarmas + dashboard |
| **S3 del state** | `infra/bootstrap` (`backend.tf`) | Almacenamiento y peticiones (coste despreciable) |

## 2. Estimación por hora y mensual

Escenario base del plan revisado: **1 NAT Gateway, 1 node group de 1–3 × `t3.medium` (desired 2),
1 instancia DocumentDB `db.t3.medium`**, un ALB y CloudWatch con retención de logs.

| Bloque | Coste aprox./hora | Coste aprox./mes (×730 h) |
|---|---|---|
| EKS control plane | $0.10 | ≈ $73 |
| 2 × `t3.medium` (desired) | ≈ $0.083 | ≈ $61 |
| DocumentDB 1 × `db.t3.medium` | ≈ $0.078 | ≈ $57 |
| NAT Gateway | $0.045 | ≈ $33 (+ tráfico) |
| ALB | ≈ $0.023 | ≈ $17 (+ LCU) |
| EBS de nodos + almacenamiento/backup DocumentDB | — | ≈ $10–15 |
| CloudWatch (logs, alarmas, dashboard) | — | ≈ $5–10 |
| S3 state | — | < $1 |
| **Total estimado** | **≈ $0.33–0.35/h** | **≈ $260–300/mes** |

Nota: el **rango de nodos importa**; con 3 nodos el coste de cómputo sube a ≈ $91/mes. Con 1 nodo
baja a ≈ $30/mes. La estimación asume un uso modesto de tráfico y logs; picos de datos inflan NAT y
CloudWatch.

## 3. Ventana de apagado (fuera de demo)

Hay dos formas de evitar el gasto cuando no se usa la infraestructura. **Elige según lo que quieras
conservar.**

### Opción A — Apagado parcial (conserva el state y la definición)

Detiene el cómputo sin destruir los recursos gestionados:

- **Escalar el node group a 0 nodos** (deja de cobrar EC2 de los nodos, pero **siguen cobrando** EKS
  control plane, NAT, DocumentDB y ALB).
- **Parar la instancia DocumentDB** (deja de cobrar la instancia; aplica retención/backup).

Es útil para pausas cortas; **no elimina el coste fijo** de control plane, NAT y ALB.

### Opción B — `terraform destroy` completo (borra TODO)

Elimina **todos** los recursos definidos en `infra/` (VPC, NAT, EIP, EKS, node group, DocumentDB,
ALB, alarmas, dashboard). **Destruye datos**: clúster y base de datos se pierden. El **bucket S3 del
state permanece** (se gestiona en `infra/bootstrap` y no lo toca el `destroy` del root), conservando
el historial de estados.

Recomendada al terminar la demo para garantizar coste ≈ 0 tras ella.

```bash
cd infra
terraform destroy
```

### Opción A (comandos)

```bash
# Escalar el node group a 0 (ajusta región y nombres a los reales)
aws eks update-nodegroup-config \
  --cluster-name <nombre-cluster> \
  --nodegroup-name <nombre-nodegroup>-eks-nodes \
  --scaling-config minSize=0,maxSize=3,desiredSize=0

# Parar la instancia DocumentDB
aws docdb stop-db-cluster --db-cluster-identifier <id-cluster-docdb>
```

Para volver a la demo, invierte la escala (por ejemplo `desiredSize=2,minSize=1`) y arranca el
clúster DocumentDB (`aws docdb start-db-cluster --db-cluster-identifier <id>`).

## 4. Chequeo pre-presentación

1. Confirmar en **Billing → Cost Explorer** el gasto acumulado y que no hay sorpresas.
2. Revisar **Billing → Alarms / Budgets** para comprobar que el tope de gasto y las alertas
   configuradas siguen activos.
3. Antes de la demo, arrancar lo necesario (`terraform apply` o escalar nodos + arrancar DocumentDB).
4. **Tras la demo, cerrar todo**: `terraform destroy` (o escala a 0 + parar DocumentDB si se desea
   conservar la definición) y verificar en Cost Explorer que el gasto deja de crecer.

## 5. Tope de gasto y alertas

El proyecto se ejecuta bajo una **cuenta AWS con tope de gasto y alertas de presupuesto ya
configuradas** (decisión registrada en `docs/wiki/07-riesgos.md`, R2). Este documento no crea ni
modifica presupuestos: solo documenta el plan de apagado. El tope de gasto es la red de seguridad
ante un olvido de apagado.
