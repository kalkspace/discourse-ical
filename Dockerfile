FROM denoland/deno:1.40.2

WORKDIR /app

COPY src .
COPY deno.lock .

RUN deno cache --lock=deno.lock handler.ts

CMD ["run", "--allow-net", "--allow-env=DISCOURSE_URL", "--lock=deno.lock", "--cached-only", "handler.ts"]
