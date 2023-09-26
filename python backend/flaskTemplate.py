template = {
  "swagger": "2.0",
  "info": {
    "title": "Liquify Maya API",
    "description": "API to easily access Maya node data",
    "specs_route": "/maya/api/docs",
    "contact": {
      "responsibleOrganization": "Liquify LTD",
      "responsibleDeveloper": "Liquify LTD",
      "email": "contact@liquify.io",
      "url": "https://www.liquify.io",
    },
    "version": "1.0"
  },
  "specs_route": "/maya/api/docs",
  "schemes": [
    "https"
  ]
}

swagger_config = {
    "headers": [
    ],
    "specs": [
        {
            "endpoint": 'specifications',
            "route": '/specifications.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "static_url_path": "/flasgger_static",
    "specs_route": "/thor/api/docs"
}