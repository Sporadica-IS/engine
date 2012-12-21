pc.extend(pc.fw, function () {
/**
     * @name pc.fw.DirectionalLightComponentSystem
     * @constructor Create a new DirectionalLightComponentSystem
     * @class A Light Component is used to dynamically light the scene.
     * @param {Object} context
     * @extends pc.fw.ComponentSystem
     */
    var DirectionalLightComponentSystem = function (context) {
        this.id = 'directionallight'
        context.systems.add(this.id, this);

        this.ComponentType = pc.fw.DirectionalLightComponent;
        this.DataType = pc.fw.DirectionalLightComponentData;

        this.schema = [{
            name: "enable",
            displayName: "Enable",
            description: "Enable or disable the light",
            type: "boolean",
            defaultValue: true
        }, {
            name: "color",
            displayName: "Color",
            description: "Light color",
            type: "rgb",
            defaultValue: "0xffffff"
        }, {
            name: "intensity",
            displayName: "Intensity",
            description: "Factors the light color",
            type: "number",
            defaultValue: 1,
            options: {
                min: 0,
                max: 10,
                step: 0.05
            }
        }, {
            name: "castShadows",
            displayName: "Cast shadows",
            description: "Cast shadows from this light",
            type: "boolean",
            defaultValue: false
        }, {
            name: 'model',
            exposed: false
        }];
        
        this.exposeProperties();

        // TODO: Only allocate graphics resources when running in Designer
        var material = new pc.scene.BasicMaterial();
        material.color = pc.math.vec4.create(1, 1, 0, 1);
        material.update();
        this.material = material;

        var format = new pc.gfx.VertexFormat();
        format.begin();
        format.addElement(new pc.gfx.VertexElement("vertex_position", 3, pc.gfx.VertexElementType.FLOAT32));
        format.end();

        // Generate the directional light arrow vertex data
        vertexData = [ 
            // Center arrow
            0, 0, 0, 0, -8, 0,       // Stalk
            -0.5, -8, 0, 0.5, -8, 0, // Arrowhead base
            0.5, -8, 0, 0, -10, 0,   // Arrowhead tip
            0, -10, 0, -0.5, -8, 0,  // Arrowhead tip
            // Lower arrow
            0, 0, -2, 0, -8, -2,         // Stalk
            -0.25, -8, -2, 0.25, -8, -2, // Arrowhead base
            0.25, -8, -2, 0, -10, -2,    // Arrowhead tip
            0, -10, -2, -0.25, -8, -2    // Arrowhead tip
        ];
        var rot = pc.math.mat4.makeRotate(120, [0, 1, 0]);
        for (var i = 0; i < 16; i++) {
            var pos = pc.math.vec3.create(vertexData[(i+8)*3], vertexData[(i+8)*3+1], vertexData[(i+8)*3+2]);
            var posRot = pc.math.mat4.multiplyVec3(pos, 1.0, rot);
            vertexData[(i+16)*3]   = posRot[0];
            vertexData[(i+16)*3+1] = posRot[1];
            vertexData[(i+16)*3+2] = posRot[2];
        }
        // Copy vertex data into the vertex buffer
        var vertexBuffer = new pc.gfx.VertexBuffer(format, 32, pc.gfx.VertexBufferUsage.STATIC);
        var positions = new Float32Array(vertexBuffer.lock());
        for (var i = 0; i < vertexData.length; i++) {
            positions[i] = vertexData[i];
        }
        vertexBuffer.unlock();
        this.vertexBuffer = vertexBuffer;

        var mesh = new pc.scene.Mesh();
        mesh.vertexBuffer = vertexBuffer;
        mesh.indexBuffer[0] = null;
        mesh.primitive[0].type = pc.gfx.PrimType.LINES;
        mesh.primitive[0].base = 0;
        mesh.primitive[0].count = this.vertexBuffer.getNumVertices();
        mesh.primitive[0].indexed = false;
        this.mesh = mesh;

        this.on('remove', this.onRemove, this);
    };
        
    DirectionalLightComponentSystem = pc.inherits(DirectionalLightComponentSystem, pc.fw.ComponentSystem);

    pc.extend(DirectionalLightComponentSystem.prototype, {
        initializeComponentData: function (component, data, properties) {
            var node = new pc.scene.LightNode();
            node.setName('directionallight');
            node.setType(pc.scene.LightType.DIRECTIONAL);

            var model = new pc.scene.Model();
            model.graph = node;
            model.lights = [ node ];

            if (this.context.designer) {
                model.meshInstances = [ new pc.scene.MeshInstance(node, this.mesh, this.material) ];
            }

            this.context.scene.addModel(model);
            component.entity.addChild(node);

            data = data || {};
            data.model = model;

            properties = ['model', 'enable', 'color', 'intensity', 'castShadows'];
            DirectionalLightComponentSystem._super.initializeComponentData.call(this, component, data, properties);
        },

        onRemove: function (entity, data) {
            entity.removeChild(data.model.graph);
            this.context.scene.removeModel(data.model);
            delete data.model;
        }
    });

    return {
        DirectionalLightComponentSystem: DirectionalLightComponentSystem
    };
}());