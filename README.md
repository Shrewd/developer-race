# Developer Race 🚀

**Developer Race** is a fun, VS Code-themed multiplayer racing game designed to decide who runs the next Daily Standup (or any other team task) in a fair and entertaining way.


## 🎮 Features

-   **VS Code Aesthetic**: The entire UI mimics the Visual Studio Code editor, complete with tabs, explorer, and syntax highlighting.
-   **Customizable Participants**: Simply list the names of your team members to get started.
-   **Interactive Race**: Watch the "developers" (sprites) type their way to the finish line.
-   **Random Events**: Boosts and penalties occur randomly, keeping the race unpredictable.
-   **Winner Podium**: A dedicated screen with a podium for the top 3 finishers and a full ranking table.
-   **Sound & Visual Effects**: Includes confetti, audio feedback, and smooth animations.
-   **Persistent Config**: Save and load your race configurations (participants, duration, prize).

## 🚀 Quick Start

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Shrewd/developer-race
    ```
2.  **Open the application**:
    Simply open the `index.html` file in any modern web browser.
3.  **Configure the race**:
    -   Go to the `src/race-config.json` tab.
    -   Enter the names of the participants (one per line).
    -   Adjust the race duration if needed.
    -   Define what the "prize" is (e.g., "runs the daily standup!").
4.  **Run the race**:
    Click the **▶ Run Race** button and enjoy!

## 🛠️ Technology Stack

-   **HTML5 & CSS3**: For the structured layout and the detailed VS Code theme (Vanilla CSS).
-   **JavaScript (ES6+)**: Core game logic, state management, and UI interactions using modular JS.
-   **Canvas API**: Used for the confetti celebration effect.

## 📁 Project Structure

-   `index.html`: The main entry point and UI structure.
-   `styles.css`: All the styling, including the VS Code theme and game animations.
-   `app.js`: Main entry point for the JavaScript logic.
-   `game/`: Contains modular scripts for race logic, state, UI, audio, and sprites.
-   `internal/`: Contains design specifications and assets.

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
