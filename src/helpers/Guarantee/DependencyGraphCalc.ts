class DependencyGraph {
    nodes: Map<number, number[]>;

    constructor() {
        this.nodes = new Map();
    }

    addDependency(objId: number, dependencyId?: number): void {
        if (dependencyId !== undefined) {
            if (!this.nodes.has(dependencyId)) {
                this.nodes.set(dependencyId, []);
            }
            this.nodes.get(dependencyId)?.push(objId);
        }
    }

    getAllDependencies(): Map<number, number[]> {
        const allDependencies = new Map<number, number[]>();

        this.nodes.forEach((dependents, objId) => {
            let stack = [...dependents];
            let dependencies = new Set<number>();

            while (stack.length > 0) {
                let currentId = stack.pop();
                if (currentId && !dependencies.has(currentId)) {
                    dependencies.add(currentId);
                    let nextDependents = this.nodes.get(currentId);
                    if (nextDependents) {
                        stack.push(...nextDependents);
                    }
                }
            }

            allDependencies.set(objId, Array.from(dependencies));
        });

        return allDependencies;
    }
}

export const calcStageDependencies = (contract: IGuaranteeContract) => {
    const graph = new DependencyGraph();
    contract.stages.forEach((stage) => {
        graph.addDependency(stage.id, (stage.offsetTo ?? 0) > 0 ? stage.offsetTo : undefined);
    });
    const allDependencies = graph.getAllDependencies();
    return allDependencies;
};
