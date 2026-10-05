FROM python:3.13-slim

# TeX Live per compilar els temes i curl per instal·lar Claude Code.
# El català de babel és a texlive-lang-spanish; lmodern va a banda.
RUN apt-get update && apt-get install -y --no-install-recommends \
        texlive-latex-base texlive-latex-recommended texlive-latex-extra \
        texlive-fonts-recommended texlive-lang-spanish lmodern \
        curl ca-certificates git ripgrep \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Claude Code no deixa saltar-se els permisos com a root: va amb un usuari propi.
RUN useradd --create-home lema
USER lema
RUN curl -fsSL https://claude.ai/install.sh | bash && mkdir -p /home/lema/.claude
ENV PATH=/home/lema/.local/bin:$PATH \
    DISABLE_AUTOUPDATER=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    WATCHFILES_FORCE_POLLING=1

WORKDIR /lema
# --reload: els canvis a web/ s'apliquen sense reconstruir la imatge.
CMD ["uvicorn", "app:app", "--app-dir", "web", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "web"]
