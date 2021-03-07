import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const subscriberDirectory = './src/subscribers';
const directoryPath = path.join(__dirname, subscriberDirectory);
const kubernetesTemplate = path.join(__dirname, 'k8s/subTemplate.yaml');

const createDeployment = async file => {
    if (file.startsWith('index.js') || file.endsWith('.map')) {
        return;
    }

    if (file.endsWith('.js')) {
        file = file.substring(0, file.length - 3);
    }

    const job = await import(path.join(directoryPath, `${file}.js`));

    if (job.deactivated) {
        return;
    }

    return {
        scriptName: file,
        schedule: job.schedule,
        replicas: job.replicas || 1,
        requestMemory: job.requestMemory || 128,
        limitMemory: job.limitMemory || 256,
    };
};

fs.readdir(directoryPath, function(err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    Promise.all(files.map(file => createDeployment(file))).then(
        jobDescriptions => {
            const template = fs.readFileSync(kubernetesTemplate).toString();

            const jobsFileContent = jobDescriptions
                .filter(x => x)
                .map(jobDescription =>
                    template
                        .replace('{{schedule}}', jobDescription.schedule)
                        .replace('{{replicas}}', jobDescription.replicas)
                        .replace(
                            '{{requestMemory}}',
                            `${jobDescription.requestMemory}Mi`
                        )
                        .replace(
                            '{{limitMemory}}',
                            `${jobDescription.limitMemory}Mi`
                        )
                        .replace(
                            new RegExp('{{scriptNameLowerCase}}', 'g'),
                            jobDescription.scriptName
                                .toLowerCase()
                                .replace('_', '-')
                        )
                        .replace(
                            new RegExp('{{scriptName}}', 'g'),
                            jobDescription.scriptName
                        )
                )
                .join('\n---\n');

            fs.writeFileSync(
                path.join(
                    __dirname,
                    'chart/templates/generated_subscribers.yml'
                ),
                jobsFileContent
            );

            console.log('summary: ');
            console.log(jobDescriptions.filter(x => x).map(j => j.scriptName));
            process.exit(0);
        }
    );
});
