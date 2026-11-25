locals {
  # Ambiente que se vigila con las alarmas de errores del backend (TVH-42).
  alarm_environment = "dev"
}

# Filtro de métrica sobre los logs de la aplicación para contar líneas de error
# del backend. El patrón asume logs estructurados en JSON con el campo "level".
resource "aws_cloudwatch_log_metric_filter" "dev_errors" {
  name           = "${var.project_name}-${local.alarm_environment}-errors"
  log_group_name = aws_cloudwatch_log_group.application[local.alarm_environment].name
  pattern        = "{ $.level = \"error\" }"

  metric_transformation {
    name      = "${local.alarm_environment}_errors"
    namespace = "TVHub/Errors"
    value     = "1"
    unit      = "Count"
  }
}

# Alarma de errores del backend en dev. Se dispara cuando hay al menos un error
# en 2 de 3 periodos de 60 segundos (M-of-N). Los periodos sin datos se tratan
# como no incumplidos para evitar falsos positivos por falta de tráfico.
resource "aws_cloudwatch_metric_alarm" "dev_errors" {
  alarm_name          = "${var.project_name}-${local.alarm_environment}-errors"
  alarm_description   = "Errores del backend en dev: 2 de 3 periodos de 60 s con al menos 1 error en los logs."
  namespace           = "TVHub/Errors"
  metric_name         = aws_cloudwatch_log_metric_filter.dev_errors.metric_transformation[0].name
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  # SNS pendiente: definir tema de notificaciones (TVH-42 lo deja fuera de alcance).
  alarm_actions = []

  tags = merge(local.tags, {
    Name        = "${var.project_name}-${local.alarm_environment}-errors"
    Environment = local.alarm_environment
  })
}
