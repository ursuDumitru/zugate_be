# Project Guidelines & Structure

- **app.js**: The main file of the project.
- **src**: Contains the source code of the project.
  - each component has its own folder and follows::
    - **component-name**: naming convention.
    - try to divide the component into smaller components and put them in
      the same folder. This way the component will be more modular and
      easier to maintain.
    - as long as there are 2 or more files that are related to each other,
      they should have their own folder. No matter the depth of the folder.
  - each file should follow:
    - **ComponentName.js**: naming convention.
    - **tab**: will be 4 spaces.
    - **imports**: separated by one empty line then two empty lines from the code.
      - **user-defined**: first.
      - **packages**: second.
