# The Next Chapter

A short browser game communicating research on multiple sclerosis narratives.

Players match text excerpts to event categories, predict the next recorded event, and choose a synthetic continuation that follows a predicted sequence.

## Play locally

Open `index.html` in a browser. No installation, build, or account is required.

## Publish with GitHub Pages

In the repository, open **Settings → Pages**, choose **Deploy from a branch**, and select **main** and **/(root)**. GitHub will provide the shareable website URL.

## About the examples

The matching task contains three selected study excerpts and their category labels. The prediction task uses recorded category sequences and saved Sequence Transformer predictions. These are selected teaching examples, not a representative evaluation of model accuracy.

The final task contains synthetic text written for the game. It is not patient testimony or output from the narrative-generation model. No prediction model runs inside this website.

The repository contains only the game and its selected examples. It excludes full datasets, patient identifiers, model weights, internal provenance records, and data-export scripts.

Scores and personal bests stay in the visitor's browser. The game has no analytics, accounts, or backend. The optional phrase classifier opens separately on Hugging Face.
