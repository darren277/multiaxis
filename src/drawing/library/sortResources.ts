import { Library, Resource } from './types';

function sortAlphabeticallyByName(resources: Resource[]) {
    return resources.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });
}

function sortAlphabeticallyByAuthorSurname(resources: Resource[]) {
    return resources.sort((a, b) => {
        const surnameA = a.author.split(' ').pop().toLowerCase();
        const surnameB = b.author.split(' ').pop().toLowerCase();

        if (surnameA < surnameB) {
            return -1;
        }
        if (surnameA > surnameB) {
            return 1;
        }
        return 0;
    });
}

function sortByYear(resources: Resource[]) {
    return resources.sort((a, b) => {
        return a.year - b.year;
    });
}

function sortByWordCount(resources: Resource[]) {
    return resources.sort((a, b) => {
        return a.word_count - b.word_count;
    });
}

function sortByPersonalRating(resources: Resource[]) {
    return resources.sort((a, b) => {
        return a.personal_rating - b.personal_rating;
    });
}

function sortByDewey(resources: Resource[]) {
    return resources.sort((a, b) => {
        const deweyA = a.dewey.split('.').map(Number);
        const deweyB = b.dewey.split('.').map(Number);

        for (let i = 0; i < Math.max(deweyA.length, deweyB.length); i++) {
            const numA = deweyA[i] || 0;
            const numB = deweyB[i] || 0;

            if (numA < numB) {
                return -1;
            }
            if (numA > numB) {
                return 1;
            }
        }
        return 0;
    });
}


export {
    sortAlphabeticallyByName,
    sortAlphabeticallyByAuthorSurname,
    sortByYear,
    sortByWordCount,
    sortByPersonalRating,
    sortByDewey
}
