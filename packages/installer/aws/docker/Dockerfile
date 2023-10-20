FROM amazon/aws-cli:latest

ARG USER_NAME
ARG USER_ID
ARG ARCH
ARG TERRAFORM_VERSION
ARG BASHRC_FILE
ARG HELM_VERSION

RUN cd /tmp && \
    yum install -y tar python3 curl unzip wget openssl bash-completion procps jq perl \
    && pip3 install aws-mfa ruamel.yaml \
    && yum clean all && \
    rm -rf /var/cache/yum

# create a new user with the provided name and ID
RUN useradd -u $USER_ID -s /bin/bash -m $USER_NAME
WORKDIR /home/$USER_NAME

# install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl" \
    && chmod 755 ./kubectl \
    && mv kubectl /usr/local/bin

# Download and install Terraform for ${ARCH} architecture
RUN curl -LO https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${ARCH}.zip \
  && unzip terraform_${TERRAFORM_VERSION}_linux_${ARCH}.zip \
  && rm terraform_${TERRAFORM_VERSION}_linux_${ARCH}.zip \
  && mv terraform /usr/local/bin/ 

RUN curl -L -o  helm.tar.gz https://get.helm.sh/helm-v${HELM_VERSION}-linux-${ARCH}.tar.gz \ 
  && tar -zxvf ./helm.tar.gz \
  && mv linux-${ARCH}/helm /usr/local/bin/helm \ 
  && rm -rf helm.tar.gz linux-${ARCH}

USER  ${USER_NAME}
COPY --chown=${USER_NAME}:${USER_NAME} install/bashrc /home/${USER_NAME}/.bashrc

ENTRYPOINT ["/bin/bash"]