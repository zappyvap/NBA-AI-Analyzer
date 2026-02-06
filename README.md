# NBA Analytics & Betting Edge Finder

 This project is a full-stack AI-powered NBA analysis platform that provides real-time statistics, league standings, and data-driven player prop analysis. It leverages the NBA API for live data and integrates Large Language Models (LLMs) via LangChain and LlamaIndex to act as a professional NBA analyst.

## Features

* **AI Chatbot**: A professional NBA analyst interface capable of answering complex queries about historical and current 2025-26 season stats using a PandasQueryEngine.
* **Edge Finder (Player Props)**: A specialized betting analysis tool that evaluates Over/Under lines by processing player form, matchup data, and injury reports to provide a confidence-rated recommendation.
* **Live Standings**: Real-time Eastern and Western Conference standings fetched directly from the NBA API.
* **League Leaders**: Dynamic leaderboards for scoring, playmaking, rebounding, steals, and blocks for the 2025-26 season.
* **Automated Injury Reports**: A RAG (Retrieval-Augmented Generation) system that downloads and parses official NBA PDF injury reports to factor into game analysis.

## Tech Stack

### Frontend
* **React + Vite**: For a fast, modern UI development experience.
* **React Router**: Handles navigation between the Chat, Standings, and Props Analyzer.

### Backend
* **FastAPI**: A high-performance Python framework for the API layer.
* **LangChain & LlamaIndex**: Orchestrates LLM agents, tool usage, and RAG pipelines for data analysis.
* **NBA API**: Fetches live game, player, and team data.
* **Pandas**: Manages historical data processing and query execution.

## Project Structure

* /backend: FastAPI application, betting engine logic, and NBA data integration scripts.
* /frontend: React application containing the dashboard and analyzer components.
* /backend/src/data: Local CSV datasets for historical player and team statistics.

## Installation & Setup

### Prerequisites
* Node.js and npm
* Python 3.9+
* OpenAI API Key

### Backend Setup
1. Navigate to the backend directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
