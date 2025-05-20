import numpy as np
import pandas as pd

descriptors={
    "A": [0.008, 0.134, -0.475, -0.039, 0.181],
    "V": [-0.274, 0.136, -0.187, -0.196, -0.299],
    "L": [-0.267, 0.018, -0.265, -0.274, 0.206],
    "I": [-0.353, 0.071, -0.088, -0.195, -0.107],
    "P": [0.173, 0.286, 0.407, -0.215, 0.384],
    "F": [-0.329, -0.023, 0.072, -0.002, 0.208],
    "W": [-0.296, -0.186, 0.389, 0.083, 0.297],
    "M": [-0.239, -0.141, -0.155, 0.321, 0.077],
    "K": [0.243, -0.339, -0.044, -0.325, -0.027],
    "R": [0.171, -0.361, 0.107, 0.258, -0.364],
    "H": [0.023, -0.177, 0.041, 0.280, -0.021],
    "G": [0.218, 0.562, -0.024, 0.018, 0.106],
    "S": [0.199, 0.238, -0.015, -0.068, -0.196],
    "T": [0.068, 0.147, -0.015, -0.132, -0.274],
    "C": [-0.132, 0.174, 0.070, 0.565, -0.374],
    "Y": [-0.141, -0.057, 0.425, -0.096, -0.091],
    "N": [0.255, 0.038, 0.117, 0.118, -0.055],
    "Q": [0.149, -0.184, -0.030, 0.035, -0.112],
    "D": [0.303, -0.057, -0.014, 0.225, 0.156],
    "E": [0.221, -0.280, -0.315, 0.157, 0.303],
}

def calculate_acc(z_descriptors, lag):
    n, D = z_descriptors.shape  # n is sequence length, D should be 5 (z1, z2, z3, z4, z5)
    acc_features = []
    for j in range(5):
        for k in range(5):
            for lag in range(1, lag + 1,1):
                acc_sum = 0
                count = 0
                for i in range(n - lag):
                    sum = ((z_descriptors[i, j]) * (z_descriptors[i + lag, k]))/(n-lag)
                    acc_sum+=sum
                    count += 1
                acc_features.append(acc_sum if count > 0 else 0)
    return np.array(acc_features)


def acc_predictor(sequence, lag=8):
    z_descriptors=[]
    for a in sequence:
        if(a in descriptors):
            z_descriptors.append(np.array(descriptors[a]))
    z_descriptors=np.array(z_descriptors)
    # # Compute ACC features
    acc_features = calculate_acc(z_descriptors, lag)
    return acc_features