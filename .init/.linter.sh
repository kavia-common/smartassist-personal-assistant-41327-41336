#!/bin/bash
cd /home/kavia/workspace/code-generation/smartassist-personal-assistant-41327-41336/ai_personal_assistant_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

