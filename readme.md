# Web-Based 3D Radar Visualization

Welcome to the **Web-Based 3D Radar Visualization** project! This repository provides an easy-to-use web application that plots radar-detected points in 2D or 3D. It is designed to help you quickly visualize and analyze radar data from FMCW radars.

## Overview

This project allows you to:
- Visualize radar data in both 2D and 3D using interactive charts (powered by Chart.js).
- Parse CSV files containing radar data with PapaParse.
- Switch between real-time and static data representations.
- Adjust chart scales dynamically based on the data's global extremes.
- Cluster points using DBSCAN for density-based spatial analysis (via [mljs/dbscan](https://github.com/mljs/dbscan)).
- Toggle dark mode for a better viewing experience.

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

**Supervisors:**  
- Henrique M. Gaspar (NTNU)  
- Stelios Mitilineos (UniWA)

## Getting Started

To run this project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MPLEKON/RADAR-WebApp.git
2. **Open index.html in your browser.**
    No additional installation is required since this is a web-based application.