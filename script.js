const TYPING_DELAYS = {
  SPACE: 80,
  PUNCTUATION: 200,
  QUOTES: 150,
  BASE: 60,
  RANDOM_RANGE: 40,
};

const SCROLL_CONFIG = {
  GROUP_TOP_OFFSET: 50,
  GROUP_BOTTOM_OFFSET: 150,
  OUTPUT_BOTTOM_THRESHOLD: 150,
  SCROLL_STEP: 60,
  FINAL_THRESHOLD: 100,
  FINAL_ADJUSTMENT: 30,
  SKIP_THRESHOLD: 80,
};

const TIMING = {
  TYPING_FINISH_DELAY: 300,
  OUTPUT_START_DELAY: 400,
  OUTPUT_INTERVAL_BASE: 400,
  OUTPUT_INTERVAL_RANDOM: 200,
  SCROLL_CHECK_DELAY: 300,
  FINAL_SCROLL_DELAY: 500,
  CALLBACK_DELAY: 1200,
  GROUP_TRANSITION_DELAY: 1500,
  SKIP_OUTPUT_INTERVAL: 80,
  SKIP_SCROLL_DELAY: 300,
  INITIAL_FADE_DELAY: 100,
  INITIAL_START_DELAY: 500,
  GROUP_START_DELAYS: {
    SCROLL_WAIT: 300,
    PROMPT_SHOW: 400,
    TYPING_START: 400,
    OUTPUT_START: 500,
    NEXT_GROUP_CHECK: 400,
  },
};

const OUTPUT_CONFIG = {
  MIN_OUTPUTS_FOR_SCROLL: 3,
  MIN_OUTPUT_INDEX_FOR_SCROLL: 2,
};

document.addEventListener("DOMContentLoaded", function () {
  const commandGroups = document.querySelectorAll(".command-group");
  let currentGroupIndex = 0;

  function getTypingDelay(char) {
    if (char === " ") return TYPING_DELAYS.SPACE;
    if ([".", ",", ":", ";"].includes(char)) return TYPING_DELAYS.PUNCTUATION;
    if (['"', "'"].includes(char)) return TYPING_DELAYS.QUOTES;
    return TYPING_DELAYS.BASE + Math.random() * TYPING_DELAYS.RANDOM_RANGE;
  }

  function typeCommand(commandElement, text, callback) {
    let currentCharIndex = 0;
    const cursor = commandElement.querySelector(".cursor");

    function type() {
      if (currentCharIndex < text.length) {
        if (cursor) cursor.remove();

        const currentText = text.substring(0, currentCharIndex + 1);
        commandElement.textContent = currentText;

        const newCursor = document.createElement("span");
        newCursor.className = "cursor";
        newCursor.textContent = "█";
        commandElement.appendChild(newCursor);

        const delay = getTypingDelay(text[currentCharIndex]);
        currentCharIndex++;
        setTimeout(type, delay);
      } else {
        setTimeout(() => {
          const finalCursor = commandElement.querySelector(".cursor");
          if (finalCursor) finalCursor.remove();
          callback();
        }, TIMING.TYPING_FINISH_DELAY);
      }
    }
    type();
  }

  function showOutputs(outputs, callback) {
    if (outputs.length === 0) {
      callback();
      return;
    }

    let outputIndex = 0;
    function showNextOutput() {
      if (outputIndex < outputs.length) {
        const output = outputs[outputIndex];
        output.classList.add("show");

        if (outputs.length >= OUTPUT_CONFIG.MIN_OUTPUTS_FOR_SCROLL) {
          setTimeout(() => {
            const terminalContainer = document.querySelector(".terminal");
            const outputRect = output.getBoundingClientRect();
            const containerRect = terminalContainer.getBoundingClientRect();

            if (
              outputIndex >= OUTPUT_CONFIG.MIN_OUTPUT_INDEX_FOR_SCROLL &&
              outputRect.bottom > containerRect.bottom - SCROLL_CONFIG.OUTPUT_BOTTOM_THRESHOLD
            ) {
              terminalContainer.scrollBy({
                top: SCROLL_CONFIG.SCROLL_STEP,
                behavior: "smooth",
              });
            }
          }, TIMING.SCROLL_CHECK_DELAY);
        }

        outputIndex++;
        setTimeout(showNextOutput, TIMING.OUTPUT_INTERVAL_BASE + Math.random() * TIMING.OUTPUT_INTERVAL_RANDOM);
      } else {
        setTimeout(() => {
          const lastOutput = outputs[outputs.length - 1];
          if (lastOutput) {
            const terminalContainer = document.querySelector(".terminal");
            const outputRect = lastOutput.getBoundingClientRect();
            const containerRect = terminalContainer.getBoundingClientRect();

            if (outputRect.bottom > containerRect.bottom - SCROLL_CONFIG.FINAL_THRESHOLD) {
              lastOutput.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
              });
            }
          }
        }, TIMING.FINAL_SCROLL_DELAY);
        setTimeout(callback, TIMING.CALLBACK_DELAY);
      }
    }

    setTimeout(showNextOutput, TIMING.OUTPUT_START_DELAY);
  }

  function processGroup() {
    if (currentGroupIndex < commandGroups.length) {
      const group = commandGroups[currentGroupIndex];
      const promptElement = group.querySelector(".prompt");
      const commandElement = group.querySelector(".command-text");
      const text = commandElement.getAttribute("data-text");
      const outputs = group.querySelectorAll(".line.output");

      const terminalContainer = document.querySelector(".terminal");
      const groupRect = group.getBoundingClientRect();
      const containerRect = terminalContainer.getBoundingClientRect();

      if (
        groupRect.top < containerRect.top + SCROLL_CONFIG.GROUP_TOP_OFFSET ||
        groupRect.top > containerRect.bottom - SCROLL_CONFIG.GROUP_BOTTOM_OFFSET
      ) {
        group.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }

      setTimeout(() => {
        promptElement.classList.remove("hidden");

        const cursor = document.createElement("span");
        cursor.className = "cursor";
        cursor.textContent = "█";

        commandElement.textContent = "";
        commandElement.appendChild(cursor);

        setTimeout(() => {
          typeCommand(commandElement, text, () => {
            const cursorElement = commandElement.querySelector(".cursor");
            if (cursorElement) {
              cursorElement.remove();
            }

            setTimeout(() => {
              showOutputs(outputs, () => {
                setTimeout(() => {
                  const terminalContainer = document.querySelector(".terminal");
                  const groupRect = group.getBoundingClientRect();
                  const containerRect = terminalContainer.getBoundingClientRect();

                  if (groupRect.bottom > containerRect.bottom + SCROLL_CONFIG.GROUP_TOP_OFFSET) {
                    terminalContainer.scrollBy({
                      top: SCROLL_CONFIG.FINAL_ADJUSTMENT,
                      behavior: "smooth",
                    });
                  }

                  currentGroupIndex++;
                  setTimeout(processGroup, TIMING.GROUP_TRANSITION_DELAY);
                }, TIMING.GROUP_START_DELAYS.NEXT_GROUP_CHECK);
              });
            }, TIMING.GROUP_START_DELAYS.OUTPUT_START);
          });
        }, TIMING.GROUP_START_DELAYS.TYPING_START);
      }, TIMING.GROUP_START_DELAYS.SCROLL_WAIT);
    }
  }

  setTimeout(() => {
    document.body.style.opacity = "1";
    setTimeout(processGroup, TIMING.INITIAL_START_DELAY);
  }, TIMING.INITIAL_FADE_DELAY);

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "Enter") {
      if (currentGroupIndex < commandGroups.length) {
        const currentGroup = commandGroups[currentGroupIndex];
        const commandElement = currentGroup.querySelector(".command-text");
        const text = commandElement.getAttribute("data-text");
        const cursor = commandElement.querySelector(".cursor");

        if (cursor) cursor.remove();
        commandElement.textContent = text;

        const outputs = currentGroup.querySelectorAll(".line.output");
        outputs.forEach((output, index) => {
          setTimeout(() => {
            output.classList.add("show");
          }, index * TIMING.SKIP_OUTPUT_INTERVAL);
        });

        setTimeout(() => {
          const lastOutput = outputs[outputs.length - 1];
          if (lastOutput) {
            const terminalContainer = document.querySelector(".terminal");
            const outputRect = lastOutput.getBoundingClientRect();
            const containerRect = terminalContainer.getBoundingClientRect();

            if (outputRect.bottom > containerRect.bottom - SCROLL_CONFIG.SKIP_THRESHOLD) {
              lastOutput.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
              });
            }
          }
        }, outputs.length * TIMING.SKIP_OUTPUT_INTERVAL + TIMING.SKIP_SCROLL_DELAY);
      }
      e.preventDefault();
    }
  });

  document.addEventListener("touchstart", function (e) {
    if (currentGroupIndex < commandGroups.length) {
      const currentGroup = commandGroups[currentGroupIndex];
      const commandElement = currentGroup.querySelector(".command-text");
      const text = commandElement.getAttribute("data-text");
      const cursor = commandElement.querySelector(".cursor");

      if (cursor) cursor.remove();
      commandElement.textContent = text;

      const outputs = currentGroup.querySelectorAll(".line.output");
      outputs.forEach((output, index) => {
        setTimeout(() => {
          output.classList.add("show");
        }, index * TIMING.SKIP_OUTPUT_INTERVAL);
      });

      setTimeout(() => {
        const lastOutput = outputs[outputs.length - 1];
        if (lastOutput) {
          const terminalContainer = document.querySelector(".terminal");
          const outputRect = lastOutput.getBoundingClientRect();
          const containerRect = terminalContainer.getBoundingClientRect();

          if (outputRect.bottom > containerRect.bottom - SCROLL_CONFIG.SKIP_THRESHOLD) {
            lastOutput.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
          }
        }
      }, outputs.length * TIMING.SKIP_OUTPUT_INTERVAL + TIMING.SKIP_SCROLL_DELAY);
    }
  });
});
