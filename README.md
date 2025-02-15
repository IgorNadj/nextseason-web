Next Season is a little website which tells you when your favourite shows are returning

See also: the back end - https://github.com/IgorNadj/nextseason-parser

### 
Build:
  - docker buildx build --platform linux/amd64,linux/arm64 . -t igornadj/nextseason
  - docker push igornadj/nextseason
