# Dashboard de observabilidad para el ambiente dev.
#
# Cubre el mínimo de TVH-44: estado de alarmas, CPU y memoria del cluster/pods
# (namespace ContainerInsights) y requests, 4xx y 5xx del ALB
# (namespace AWS/ApplicationELB) mediante expresiones SEARCH válidas.
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
          alarms = [aws_cloudwatch_metric_alarm.dev_errors.arn]
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
            ["ContainerInsights", "node_cpu_utilization", "ClusterName", var.cluster_name, { label = "CPU nodos" }],
            [{ expression = "SEARCH('{ContainerInsights,ClusterName,Namespace,PodName} ClusterName=\"${var.cluster_name}\" MetricName=\"pod_cpu_utilization\"', 'Average', 300)", label = "CPU pods" }],
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
            ["ContainerInsights", "node_memory_utilization", "ClusterName", var.cluster_name, { label = "Memoria nodos" }],
            [{ expression = "SEARCH('{ContainerInsights,ClusterName,Namespace,PodName} ClusterName=\"${var.cluster_name}\" MetricName=\"pod_memory_utilization\"', 'Average', 300)", label = "Memoria pods" }],
          ]
        }
      },

      # Requests totales del ALB.
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Requests totales - ALB"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
          metrics = [
            [{ expression = "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"RequestCount\"', 'Sum', 300)", label = "Requests ALB" }],
          ]
        }
      },

      # Requests 4xx del ALB.
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Requests 4xx - ALB"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
          metrics = [
            [{ expression = "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTPCode_ELB_4XX_Count\"', 'Sum', 300)", label = "4xx ELB" }],
            [{ expression = "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTPCode_Target_4XX_Count\"', 'Sum', 300)", label = "4xx target" }],
          ]
        }
      },

      # Requests 5xx del ALB.
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title  = "Requests 5xx - ALB"
          region = "us-east-1"
          view   = "timeSeries"
          period = 300
          stat   = "Sum"
          metrics = [
            [{ expression = "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTPCode_ELB_5XX_Count\"', 'Sum', 300)", label = "5xx ELB" }],
            [{ expression = "SEARCH('{AWS/ApplicationELB,LoadBalancer} MetricName=\"HTTPCode_Target_5XX_Count\"', 'Sum', 300)", label = "5xx target" }],
          ]
        }
      },
    ]
  })
}
