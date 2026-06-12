# 7. Comprehensive Financial Infrastructure Costing Projections

| Resource Component Type | AWS Operational Tier Sizing Target | MVP Launch | 10k MAU Scale | 100k MAU Scale |
| :--- | :--- | :--- | :--- | :--- |
| **Application Compute** | AWS ECS Fargate Fleet (Arm64 Architecture) | $15.00 / mo | $45.00 / mo | $180.00 / mo |
| **Relational Database** | AWS RDS PostgreSQL DB (Multi-AZ Engaged) | $22.00 / mo | $64.00 / mo | $250.00 / mo |
| **High-Speed Async Cache** | Serverless AWS ElastiCache Redis Clusters | $0.00 (Local Dev) | $18.00 / mo | $90.00 / mo |
| **Security & Site Reliability** | CloudWatch, AWS KMS Secrets, Sentry Tracking | $5.00 / mo | $25.00 / mo | $120.00 / mo |
| **VPC Network Egress Transit** | NAT Gateway Allocations & Direct Port Transfers | $12.00 / mo | $32.00 / mo | $110.00 / mo |
| **Aggregated Total Scale Budget** | — | **$54.00 / mo** | **$184.00 / mo** | **$790.00 / mo** |
