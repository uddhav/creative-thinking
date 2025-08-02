#!/bin/bash

# run-with-output.sh - Runs npm commands with output redirection
# Usage: ./scripts/run-with-output.sh <command>

# Ensure output directory exists
OUTPUT_DIR=".build-output"
mkdir -p "$OUTPUT_DIR"

# Get the command name (first argument)
COMMAND="$1"
shift # Remove first argument, rest are passed to npm

# Determine log file names based on command
case "$COMMAND" in
    "build")
        LOG_FILE="$OUTPUT_DIR/build.log"
        ERROR_FILE="$OUTPUT_DIR/build.error.log"
        NPM_SCRIPT="build"
        ;;
    "test:run")
        LOG_FILE="$OUTPUT_DIR/test.log"
        ERROR_FILE="$OUTPUT_DIR/test.error.log"
        NPM_SCRIPT="test:run"
        ;;
    "lint")
        LOG_FILE="$OUTPUT_DIR/lint.log"
        ERROR_FILE="$OUTPUT_DIR/lint.error.log"
        NPM_SCRIPT="lint"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        exit 1
        ;;
esac

# Run the command with output redirection
echo "Running: npm run $NPM_SCRIPT $@"
echo "Output: $LOG_FILE"
echo "Errors: $ERROR_FILE"

# Clear previous logs
> "$LOG_FILE"
> "$ERROR_FILE"

# Run npm command, capturing stdout and stderr separately
npm run "$NPM_SCRIPT" -- "$@" > "$LOG_FILE" 2> "$ERROR_FILE"
EXIT_CODE=$?

# Create status summary
STATUS_FILE="$OUTPUT_DIR/last-run-status.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Count lines in error file (to check if there were any errors/warnings)
ERROR_LINES=$(wc -l < "$ERROR_FILE" | tr -d ' ')

# Create JSON status file
cat > "$STATUS_FILE" << EOF
{
  "command": "$NPM_SCRIPT",
  "exitCode": $EXIT_CODE,
  "timestamp": "$TIMESTAMP",
  "logFile": "$LOG_FILE",
  "errorFile": "$ERROR_FILE",
  "hasErrors": $([ $EXIT_CODE -ne 0 ] && echo "true" || echo "false"),
  "errorLineCount": $ERROR_LINES
}
EOF

# Print brief status
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ $NPM_SCRIPT completed successfully"
else
    echo "❌ $NPM_SCRIPT failed with exit code $EXIT_CODE"
    echo "Check $ERROR_FILE for details"
fi

exit $EXIT_CODE