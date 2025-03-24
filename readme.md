# Web-Based 3D Radar Visualization

📁 **Project Versions**
> Click a version below to launch the live visualizer:

- [v0_mar_19_25](https://MPLEKON.github.io/RADAR-WebApp/v0_mar_19_25/v0_mar_19_25_giannis_index.html)
- [v1](https://MPLEKON.github.io/RADAR-WebApp/v1/v1_marc_20_25.html)
- [v2](https://MPLEKON.github.io/RADAR-WebApp/v2/v2_marc_21_25.html)
- [v3](https://MPLEKON.github.io/RADAR-WebApp/v3/v3_all_files/v3_marc_24_25.html)

---

Welcome to the **Web-Based 3D Radar Visualization** project! This repository provides an easy-to-use web application that plots radar-detected points in 2D or 3D. It is designed to help you quickly visualize and analyze radar data from FMCW radars.

## Overview

This project allows you to:
- Visualize radar data in both 2D and 3D using interactive charts (powered by Chart.js).
- Parse CSV files containing radar data with PapaParse.
- Switch between real-time and static data representations.
- Adjust chart scales dynamically based on the data's global extremes.
- Cluster points using DBSCAN for density-based spatial analysis.
- Toggle dark mode for a better viewing experience.
- 
## Versions
This project has multiple versions:
- **v0**: Initial test version — converts CSV data to JSON and plots using Chart.js.
- **v1**: A simplified and cleaner version of v0.
- **v2**: Supports loading JavaScript files that contain the raw CSV as a string.
- **v3**: The most impactful version — loads CSV files in the format described below, and performs clustering using DBSCAN on buffered data (20 frames) for smoothing.

## CSV File Format

The application accepts CSV files with the following header:

Frame Number,POSIX Timestamp,Num Detected Objects,Detected Objects

Each detected object should consist of 5 values, enclosed in brackets, in the following order:
- **x (m)**
- **y (m)**
- **z (m)**
- **radial velocity (m/s)**
- **SNR (dB)**

A demo CSV file is provided for testing, or you can upload your own.

## How to Use

1. **Upload CSV:**  
   Click the **Browse...** button to upload your CSV file. (You can use the provided demo if needed.)

2. **Select Visualization:**  
   Choose the desired plot from the dropdown menu (e.g., Y vs Frames, X vs Y, etc.).

3. **Toggle Real-Time Mode:**  
   Enable or disable Real-Time mode as required.

4. **Control Playback:**  
   Use the Start/Stop buttons to begin or pause the visualization.

## Features

- **Real-time/Static Visualization:** Choose between live data updates or a static view.
- **CSV Parsing:** Seamlessly parse radar data CSV files with PapaParse.
- **Multiple Plot Options:** Visualize data with various plotting options such as Y vs Frames, X vs Y, etc.
- **Dynamic Chart Scaling:** Automatically adjusts chart scales based on the global extremes of your data.
- **Dark Mode:** Enjoy a dark-themed interface for comfortable viewing.
- **Interactive Controls:** Easily start, stop, and switch between different visualizations.
- **Clustering with DBSCAN:** Apply a density-based clustering algorithm to your data. Adjust DBSCAN parameters directly in the JavaScript file as needed.

## Project Collaboration

This project is a collaborative effort between the **University of West Attica (UniWA)** and the **Norwegian University of Science and Technology (NTNU)**.

**Contributors:**  
- Ioannis Christopoulos (UniWA)  [LinkedIn](https://www.linkedin.com/in/ioannis-christopoulos-3abab6227/)
- Fotios Papadopoulos (UniWA) [LinkedIn](https://www.linkedin.com/in/fotios-papadopoulos-22722b299/)

**Supervisors:**  
- Henrique M. Gaspar (NTNU)  
- Stelios Mitilineos (UniWA)

## Getting Started

To run this project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MPLEKON/RADAR-WebApp.git
