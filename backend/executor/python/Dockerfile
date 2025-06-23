FROM python:3.11-slim 
RUN apt-get update && apt-get install time
WORKDIR /code
COPY run.sh .
RUN chmod +x run.sh
CMD ["./run.sh"]