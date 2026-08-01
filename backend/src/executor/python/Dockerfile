FROM python:3.11-slim
WORKDIR /code
RUN chmod 777 /code
COPY run.sh .
RUN chmod +x run.sh
CMD ["bash", "run.sh"]
