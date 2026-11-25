# Dashboard de observabilidad para el ambiente dev.
#
# Cubre el mínimo de TVH-44: estado de alarmas, CPU y memoria del cluster/pods
# (namespace CWContainerInsights) y requests 4xx/5xx del ALB
# (namespace AWS/ApplicationELB). Es solo declarativo: las métricas reales
# aparecen cuando Container Insights y el ALB están publicando datos.
#
# Las dimensiones del ALB aún no existen como input del módulo, por eso se
# usan comodines "SEARCH"-style (dimensión LoadBalancer = "*") que agreguen
# todos los ALB del proyecto hasta que exista un ALB real desplegado.
resource "aws_cloudwatch_dashboard" "tvhub_dev" {
  dashboard_name = "${var.project_name}-dev"

  dashboard_body = jsonencode({
    start          = "-PT8H"
    periodOverride = "INHERIT"

    widgets = [
      # Fila superior: estado de las alarmas del proyecto.
      {
        type   = "alarm"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        properties = {
          title  = "${var.project_name} dev - estado de alarmas"
          alarms = []
          sortBy = "stateUpdatedTimestamp"
          states = ["ALARM", "INSUFFICIENT_DATA", "OK"]
        }
      },

      # CPU del cluster y de los pods (Container Insights).
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "CPU - cluster y pods (Container Insights)"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Average"
          metrics = [
            ["CWContainerInsights", "node_cpu_utilization", "ClusterName", var.cluster_name, { label = "CPU nodos" }],
            ["CWContainerInsights", "pod_cpu_utilization", "ClusterName", var.cluster_name, "PodName", "*", "Namespace", "*", { label = "CPU pods" }],
          ]
        }
      },

      # Memoria del cluster y de los pods (Container Insights).
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Memoria - cluster y pods (Container Insights)"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Average"
          metrics = [
            ["CWContainerInsights", "node_memory_utilization", "ClusterName", var.cluster_name, { label = "Memoria nodos" }],
            ["CWContainerInsights", "pod_memory_utilization", "ClusterName", var.cluster_name, "PodName", "*", "Namespace", "*", { label = "Memoria pods" }],
          ]
        }
      },

      # Requests 4xx del ALB.
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "Requests 4xx - ALB"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_4XX_Count", "LoadBalancer", "*", { label = "4xx ELB" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", "*", { label = "4xx target" }],
          ]
        }
      },

      # Requests 5xx del ALB.
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "Requests 5xx - ALB"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", "*", { label = "5xx ELB" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "*", { label = "5xx target" }],
          ]
        }
      },
    ]
  })
}
