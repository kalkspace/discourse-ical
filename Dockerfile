FROM denoland/deno:1.31.3

WORKDIR /app

COPY . .

RUN deno cache --lock=deno.lock handler.ts

CMD ["run", "--allow-net", "--allow-env=DISCOURSE_URL", "--lock=deno.lock", "--cached-only", "handler.ts"]
